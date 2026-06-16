import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { PROVIDER_CODES } from "../lib/pawapay/constants";
import { initiateDeposit, pollDepositUntilFinal } from "../lib/pawapay/deposits";
import { initiatePayout, pollPayoutUntilFinal } from "../lib/pawapay/payouts";
import { initiateRefund, pollRefundUntilFinal } from "../lib/pawapay/refunds";
import { ensureSupabaseConfigured, supabase, supabaseConfigError } from "../lib/supabase";
import { loadAppData, subscribeToAppData, syncProfileFromSession as syncProfileFromSessionHelper } from "./appService";
import type { AppContextType, AppNotification, Circle, Escrow, Transaction, UserProfile } from "./types";

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  id: "",
  name: "",
  phone: "",
  email: "",
  avatarUrl: "https://i.pravatar.cc/150?img=11",
  isLoggedIn: false,
};

const getAvatarStorageKey = (userId: string) => `mboa_avatar_${userId}`;

const loadStoredAvatar = async (userId: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(getAvatarStorageKey(userId));
  } catch (e) {
    console.warn("Error loading stored avatar", e);
    return null;
  }
};

const persistAvatar = async (userId: string, avatarUrl: string) => {
  try {
    await AsyncStorage.setItem(getAvatarStorageKey(userId), avatarUrl);
  } catch (e) {
    console.warn("Error saving avatar", e);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState("");
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedOperator, setSelectedOperator] = useState<'MTN' | 'Orange'>('MTN');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchAppData = useCallback(async (currentUserId: string) => {
    await loadAppData(currentUserId, setWalletBalance, setTransactions, setNotifications, setCircles, setEscrows);
  }, []);

  const syncProfileFromSession = useCallback(async (session: Session | null) => {
    const isComplete = await syncProfileFromSessionHelper(session, setAuthSession, setUser, fetchAppData, INITIAL_USER);
    if (session?.user?.id) {
      const storedAvatarUrl = await loadStoredAvatar(session.user.id);
      if (storedAvatarUrl) {
        setUser((prev) => ({ ...prev, avatarUrl: storedAvatarUrl }));
      }
    }
    return isComplete;
  }, [fetchAppData]);

  const refreshData = async () => {
    if (user.id) {
      await fetchAppData(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      if (supabaseConfigError) {
        console.warn(supabaseConfigError);
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        await syncProfileFromSession(session);
        setIsAuthLoading(false);
      }
    };

    void hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        void syncProfileFromSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfileFromSession]);

  // Realtime subscriptions for live dashboard
  useEffect(() => {
    if (user.id && user.isLoggedIn) {
      const unsubscribe = subscribeToAppData(user.id, fetchAppData);
      return () => unsubscribe();
    }
  }, [user.id, user.isLoggedIn, fetchAppData]);

  // Load persisted operator or auto-detect when user changes
  useEffect(() => {
    let mounted = true;
    const loadOperatorPref = async () => {
      try {
        const stored = await AsyncStorage.getItem("mboa_mno_override");
        if (mounted && stored && (stored === 'MTN' || stored === 'Orange')) {
          setSelectedOperator(stored as 'MTN' | 'Orange');
          return;
        }

        if (mounted) {
          const detected = await autoDetectMNO(user.phone);
          setSelectedOperator(detected);
        }
      } catch (e) {
        console.warn("Error loading MNO preference", e);
      }
    };

    void loadOperatorPref();

    return () => { mounted = false; };
  }, [user.phone]);

  const login = async (phone: string) => {
    ensureSupabaseConfigured();
    setUser((prev) => ({ ...prev, phone }));
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
  };

  const loginWithEmail = async (email: string, password: string) => {
    ensureSupabaseConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const completedProfile = await syncProfileFromSession(data.session);
    return { needsProfileSetup: !completedProfile };
  };

  const registerWithEmail = async (email: string, password: string, fullName: string, phone: string, mnoProvider?: string) => {
    ensureSupabaseConfigured();
    setUser((prev) => ({ ...prev, phone, email, name: fullName }));
    if (mnoProvider) setSelectedOperator(mnoProvider as 'MTN' | 'Orange');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, mno_provider: mnoProvider || null }
      }
    });
    
    if (error) {
      console.error("SUPABASE SIGNUP ERROR:", error);
      throw new Error(error.message);
    }
    
    // Store the email so the OTP screen can use it
    setPendingEmail(email);
    
    // Don't sync session yet — user must verify OTP first
    return { pendingEmail: email };
  };

  const verifyOtp = async (email: string, token: string) => {
    ensureSupabaseConfigured();
    if (!email) throw new Error("Email is missing. Please go back and register again.");
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) throw new Error(error.message);
    const completedProfile = await syncProfileFromSession(data.session);
    return { needsProfileSetup: !completedProfile };
  };

  const updateProfile = async (name: string, email: string, avatarUrl?: string, phone?: string) => {
    ensureSupabaseConfigured();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const { data: { session } } = await supabase.auth.getSession();
    const currentSession = authSession || session;

    if (!currentSession?.user.id) throw new Error("Your session expired. Please sign in again.");

    // Build the update object dynamically so we can include phone if provided
    const updateFields: Record<string, any> = { full_name: trimmedName };
    if (phone) updateFields.phone = phone;

    const { data: updatedProfile, error: profileError } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", currentSession.user.id)
      .select("id")
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    if (!updatedProfile) throw new Error("Profile row not found. Run auth_trigger.sql in Supabase, then try again.");

    if (avatarUrl) {
      await persistAvatar(currentSession.user.id, avatarUrl);
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: trimmedName, email: trimmedEmail || null, avatar_url: avatarUrl || null, phone: phone || null },
    });

    if (metadataError) throw new Error(metadataError.message);

    setUser((prev) => ({
      ...prev, id: currentSession.user.id, name: trimmedName, email: trimmedEmail,
      phone: phone || prev.phone, avatarUrl: avatarUrl || prev.avatarUrl, isLoggedIn: true,
    }));
    await fetchAppData(currentSession.user.id);
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user.id) throw new Error("You must be signed in to update your avatar.");
    await persistAvatar(user.id, avatarUrl);
    setUser((prev) => ({ ...prev, avatarUrl }));
  };

  const setOperator = (op: 'MTN' | 'Orange') => {
    setSelectedOperator(op);
    try {
      AsyncStorage.setItem("mboa_mno_override", op);
    } catch (e) {
      console.warn("Could not persist MNO override", e);
    }
  };

  const autoDetectMNO = async (phone?: string | null): Promise<'MTN' | 'Orange'> => {
    try {
      const stored = await AsyncStorage.getItem("mboa_mno_override");
      if (stored === 'MTN' || stored === 'Orange') return stored as 'MTN' | 'Orange';
    } catch (e) {
      // ignore
    }

    if (phone && phone.length >= 9) {
      try {
        const token = process.env.EXPO_PUBLIC_PAWAPAY_TOKEN;
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        // strip local 237 if they entered it so we only append once
        const basePhone = cleanPhone.startsWith("237") ? cleanPhone.slice(3) : cleanPhone;
        const fullPhone = `+237${basePhone}`;
        
        const resp = await fetch("https://api.sandbox.pawapay.io/v2/predict-provider", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: fullPhone }),
        });
        if (resp.ok) {
          const body = await resp.json();
          const prov = (body?.provider || "").toString().toUpperCase();
          if (prov.includes("MTN")) return "MTN";
          if (prov.includes("ORANGE")) return "Orange";
        }
      } catch (e) {
        console.warn("MNO prediction failed", e);
      }
    }
    return 'MTN';
  };

  const topUpWallet = async (amount: number, operator: 'MTN' | 'Orange'): Promise<string> => {
    const depositId = generateId();
    const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

    // 1. Insert a pending transaction first to be safe
    const { error: txError } = await supabase.from('transactions').insert({
      id: depositId,
      user_id: user.id,
      amount,
      type: 'top_up',
      status: 'pending',
      mno_provider: operator
    });
    if (txError) throw new Error(txError.message);

    // 2. Initiate deposit
    await initiateDeposit({
      depositId,
      phoneNumber: user.phone,
      provider,
      amount,
      note: "Wallet Top-up",
    });

    // 3. Poll for completion
    const finalStatus = await pollDepositUntilFinal(depositId);
    
    if (finalStatus.status === "COMPLETED") {
      // 4. Update transaction status and wallet balance
      await supabase.from('transactions').update({ 
        status: 'successful',
        pawapay_ref: finalStatus.depositId || depositId,
        metadata: finalStatus
      }).eq('id', depositId);
      await supabase.rpc('increment_wallet_balance', { p_user_id: user.id, p_amount: amount });
      await fetchAppData(user.id);
      return depositId;
    } else {
      await supabase.from('transactions').update({ 
        status: 'failed',
        pawapay_ref: finalStatus.depositId || depositId,
        metadata: finalStatus
      }).eq('id', depositId);
      throw new Error(`Deposit failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

  const sendMoney = async (amount: number, phone: string, operator: 'MTN' | 'Orange', note: string): Promise<string> => {
    try {
      if (amount > walletBalance) {
        throw new Error("Insufficient wallet balance for this transfer.");
      }

      const payoutId = generateId();
      const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

      // 1. Insert a pending transaction first to be safe
      const { error: txError } = await supabase.from('transactions').insert({
        id: payoutId,
        user_id: user.id,
        amount,
        type: 'disbursement',
        status: 'pending',
        mno_provider: operator
      });
      if (txError) throw new Error(txError.message);

      // 2. Initiate payout
      await initiatePayout({
        payoutId,
        phoneNumber: phone,
        provider,
        amount,
        note: note || "Wallet Transfer",
      });

      // 3. Poll for completion
      const finalStatus = await pollPayoutUntilFinal(payoutId);
      
      if (finalStatus.status === "COMPLETED") {
        // 4. Update transaction status and wallet balance
        await supabase.from('transactions').update({ 
          status: 'successful',
          pawapay_ref: finalStatus.payoutId || payoutId,
          metadata: finalStatus
        }).eq('id', payoutId);
        await supabase.rpc('decrement_wallet_balance', { p_user_id: user.id, p_amount: amount });
        await fetchAppData(user.id);
        return payoutId;
      } else {
        await supabase.from('transactions').update({ 
          status: 'failed',
          pawapay_ref: finalStatus.payoutId || payoutId,
          metadata: finalStatus
        }).eq('id', payoutId);
        throw new Error(`Transfer failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("[sendMoney] Exception:", error);
      throw error;
    }
  };

  const createCircle = async (
    name: string, type: 'solo' | 'pool' | 'rotation', goal: number, contribution: number, frequency: 'daily' | 'weekly' | 'monthly', maxMembers: number
  ): Promise<{ id: string, name: string, code: string }> => {
    const { data, error } = await supabase.rpc('create_circle', {
      p_name: name,
      p_goal_type: 'general',
      p_circle_type: type,
      p_target_amount: goal,
      p_contribution_amount: contribution,
      p_frequency: frequency
    });
    if (error) throw new Error(error.message);
    await fetchAppData(user.id);
    return { id: data?.id || "", name: data?.name || name, code: data?.invite_code || "" };
  };

  const joinCircleByCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const { data, error } = await supabase.rpc('join_circle', { p_invite_code: code });
    if (error) return { success: false, message: error.message };
    await fetchAppData(user.id);
    return { success: true, message: `Successfully joined ${data?.name || 'circle'}!` };
  };

  const payCircleContribution = async (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;

    const depositId = generateId();
    const provider = selectedOperator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

    // 1. Insert pending contribution
    const { error: insertError } = await supabase.from('contributions').insert({
      circle_id: circleId,
      user_id: user.id,
      pawapay_deposit_id: depositId,
      amount: circle.contributionAmount,
      cycle_number: circle.currentRound,
      status: 'PENDING',
      due_at: new Date().toISOString()
    });
    if (insertError) throw new Error(insertError.message);

    // 2. Initiate deposit
    await initiateDeposit({
      depositId,
      phoneNumber: user.phone,
      provider,
      amount: circle.contributionAmount,
      note: `Circle ${circle.name} Contribution`
    });

    // 3. Poll for completion
    const finalStatus = await pollDepositUntilFinal(depositId);

    if (finalStatus.status === "COMPLETED") {
      // 4. Update status
      await supabase.from('contributions').update({ 
        status: 'COMPLETED',
        paid_at: new Date().toISOString()
      }).eq('pawapay_deposit_id', depositId);
      
      // Update member deposit_status
      await supabase.from('circle_members')
        .update({ deposit_status: 'paid' })
        .eq('circle_id', circleId)
        .eq('user_id', user.id);

      await fetchAppData(user.id);
    } else {
      await supabase.from('contributions').update({ status: 'FAILED' }).eq('pawapay_deposit_id', depositId);
      throw new Error(`Contribution failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

  const createEscrowContract = async (
    title: string, desc: string, amount: number, otherParty: string, role: 'buyer' | 'seller'
  ) => {
    if (role === 'seller') {
      throw new Error("Only buyers can currently initiate escrow contracts in this demo.");
    }
    const depositId = generateId();
    const provider = selectedOperator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

    // 1. Initiate lock deposit
    await initiateDeposit({
      depositId,
      phoneNumber: user.phone,
      provider,
      amount,
      note: "Escrow Contract Lock"
    });

    // 2. Poll for completion
    const finalStatus = await pollDepositUntilFinal(depositId);

    if (finalStatus.status === "COMPLETED") {
      const { data: recipientId, error: rpcError } = await supabase.rpc('get_user_by_phone', { p_phone: otherParty });
      if (rpcError || !recipientId) throw new Error("Recipient not found on MboaPay.");

      // 3. Create escrow record
      const { error: insertError } = await supabase.from('escrows').insert({
        id: depositId,
        sender_id: user.id,
        recipient_id: recipientId,
        amount,
        description: desc,
        status: 'locked'
      });
      if (insertError) throw new Error(insertError.message);
      await fetchAppData(user.id);
    } else {
      throw new Error(`Escrow lock failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

  const releaseEscrowContract = async (escrowId: string) => {
    const escrow = escrows.find(e => e.id === escrowId);
    if (!escrow) throw new Error("Escrow not found");

    const payoutId = generateId();
    // Assuming recipient is on the same operator for simplicity, or we can use auto-detect
    const provider = selectedOperator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

    // 1. Initiate Payout to seller
    await initiatePayout({
      payoutId,
      phoneNumber: escrow.otherParty, // The recipient_phone
      provider,
      amount: escrow.amount,
      note: "Escrow Release"
    });

    // 2. Poll for completion
    const finalStatus = await pollPayoutUntilFinal(payoutId);

    if (finalStatus.status === "COMPLETED") {
      await supabase.from('escrows').update({ status: 'released' }).eq('id', escrowId);
      await fetchAppData(user.id);
    } else {
      throw new Error(`Escrow release failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

  const disputeEscrowContract = async (escrowId: string) => {
    const refundId = generateId();

    // 1. Initiate Refund to original buyer
    await initiateRefund({
      refundId,
      depositId: escrowId, // Assuming escrowId is the depositId
    });

    // 2. Poll for completion
    const finalStatus = await pollRefundUntilFinal(refundId);

    if (finalStatus.status === "COMPLETED") {
      await supabase.from('escrows').update({ status: 'disputed' }).eq('id', escrowId);
      await fetchAppData(user.id);
    } else {
      throw new Error(`Escrow refund failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

 

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.rpc('mark_notifications_read', { p_notification_ids: unreadIds });
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const resetAppState = () => {
    setAuthSession(null);
    setUser(INITIAL_USER);
    setWalletBalance(0);
    setTransactions([]);
    setCircles([]);
    setEscrows([]);
    setNotifications([]);
  };

  const logout = async () => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    resetAppState();
  };

  const requestPasswordReset = async (email: string) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    if (error) throw new Error(error.message);
  };

  const verifyPasswordResetOtp = async (email: string, token: string) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (newPassword: string) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  const resendSignupOtp = async (email: string) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new Error(error.message);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authSession,
        hasAuthSession: Boolean(authSession),
        isAuthLoading,
        walletBalance,
        selectedOperator,
        transactions,
        circles,
        escrows,
        notifications,
        pendingEmail,
        login,
        loginWithEmail,
        registerWithEmail,
        verifyOtp,
        updateProfile,
        updateAvatar,
        setOperator,
        topUpWallet,
        sendMoney,
        createCircle,
        joinCircleByCode,
        payCircleContribution,
        createEscrowContract,
        releaseEscrowContract,
        disputeEscrowContract,
        markNotificationsAsRead,
        resetAppState,
        logout,
        requestPasswordReset,
        verifyPasswordResetOtp,
        updatePassword,
        resendSignupOtp,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export type { AppNotification, Circle, Escrow, Transaction, UserProfile } from "./types";

