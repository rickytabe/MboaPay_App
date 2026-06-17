import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DARK_COLORS, LIGHT_COLORS } from "../constants/Theme";
import { notifyAdminOfPendingMember, notifyUserOfApproval, registerPushNotifications, savePushToken } from "../lib/notificationService";
import { PROVIDER_CODES } from "../lib/pawapay/constants";
import { initiateDeposit, pollDepositUntilFinal } from "../lib/pawapay/deposits";
import { initiatePayout, pollPayoutUntilFinal } from "../lib/pawapay/payouts";
import { ensureSupabaseConfigured, supabase, supabaseConfigError } from "../lib/supabase";
import { uploadAvatarToSupabase } from "../lib/uploadImage";
import { fetchCircles, fetchEscrows, fetchNotifications, fetchTransactions, fetchWalletBalance, syncProfileFromSession as syncProfileFromSessionHelper } from "./appService";
import type { AppContextType, AppNotification, Circle, Escrow, Transaction, UserProfile } from "./types";
import * as Notifications from "expo-notifications";



const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
  avatarUrl: "",
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

const setNotificationHandler = async () => {

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState("");
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem('mboapay_theme', nextTheme);
    } catch (e) {
      console.warn("Failed to persist theme", e);
    }
  }, [theme]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('mboapay_theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
        }
      } catch (e) {
        console.warn("Failed to load stored theme", e);
      }
    };
    loadTheme();
  }, []);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedOperator, setSelectedOperator] = useState<'MTN' | 'Orange'>('MTN');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const { data: qWalletBalance, refetch: refetchWallet } = useQuery({ queryKey: ['walletBalance', user.id], queryFn: () => fetchWalletBalance(user.id), refetchInterval: 5000, enabled: !!user.id && user.isLoggedIn });
  const { data: qTransactions, refetch: refetchTx } = useQuery({ queryKey: ['transactions', user.id], queryFn: () => fetchTransactions(user.id), refetchInterval: 5000, enabled: !!user.id && user.isLoggedIn });
  const { data: qNotifications, refetch: refetchNotif } = useQuery({ queryKey: ['notifications', user.id], queryFn: () => fetchNotifications(user.id), refetchInterval: 5000, enabled: !!user.id && user.isLoggedIn });
  const { data: qCircles, refetch: refetchCircles } = useQuery({ queryKey: ['circles', user.id], queryFn: () => fetchCircles(user.id), refetchInterval: 5000, enabled: !!user.id && user.isLoggedIn });
  const { data: qEscrows, refetch: refetchEscrows } = useQuery({ queryKey: ['escrows', user.id], queryFn: () => fetchEscrows(user.id), refetchInterval: 5000, enabled: !!user.id && user.isLoggedIn });

  useEffect(() => { if (qWalletBalance !== undefined) setWalletBalance(qWalletBalance); }, [qWalletBalance]);
  useEffect(() => { if (qTransactions) setTransactions(qTransactions); }, [qTransactions]);
  useEffect(() => { if (qNotifications) setNotifications(qNotifications); }, [qNotifications]);
  useEffect(() => { if (qCircles) setCircles(qCircles); }, [qCircles]);
  useEffect(() => { if (qEscrows) setEscrows(qEscrows); }, [qEscrows]);

  const syncProfileFromSession = useCallback(async (session: Session | null) => {
    const isComplete = await syncProfileFromSessionHelper(session, setAuthSession, setUser, INITIAL_USER);
    if (session?.user?.id) {
      const storedAvatarUrl = await loadStoredAvatar(session.user.id);
      if (storedAvatarUrl) {
        setUser((prev) => ({ ...prev, avatarUrl: storedAvatarUrl }));
      }
    }
    return isComplete;
  }, []);

  const refreshData = async () => {
    if (user.id) {
      await Promise.all([refetchWallet(), refetchTx(), refetchNotif(), refetchCircles(), refetchEscrows()]);
    }
  };

  const presentLocalNotification = async (title: string, body: string) => {
    try {
      await setNotificationHandler();

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
        },
        trigger: null,
      });
    } catch (error) {
      console.warn("Local notification failed:", error);
    }
  };

  const createNotificationRecord = async (type: string, title: string, message: string, targetUserId?: string) => {
    const userIdToUse = targetUserId || user.id;
    if (!userIdToUse) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: userIdToUse,
      type,
      message: `**${title}**\n\n${message}`,
    });
    if (error) {
      console.warn("Notification record error:", error.message);
    }
  };

  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        const token = await registerPushNotifications();
        if (token && user.id) {
          await savePushToken(user.id, token);
        }
      } catch (error) {
        console.warn("Push notification setup failed:", error);
      }
    };

    if (user.id && user.isLoggedIn) {
      void setupPushNotifications();
    }
  }, [user.id, user.isLoggedIn]);

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

  // (Realtime app data subscriptions replaced by TanStack Query polling)

  // Realtime notifications listener to present local alerts instantly
  useEffect(() => {
    if (!user.id || !user.isLoggedIn) return;

    const notifChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            void presentLocalNotification(
              payload.new.title || "MboaPay",
              payload.new.message || ""
            );
            void refreshData();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(notifChannel);
    };
  }, [user.id, user.isLoggedIn]);

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
    await refreshData();
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user.id) throw new Error("You must be signed in to update your avatar.");

    const remotePath = await uploadAvatarToSupabase(avatarUrl, user.id);
    if (!remotePath) throw new Error("Failed to upload avatar image.");

    const { error } = await supabase.from("users").update({ avatar_url: remotePath }).eq("id", user.id);
    if (error) throw new Error(error.message);

    // Refresh profile to get signed URL
    const { data: sessionData } = await supabase.auth.getSession();
    await syncProfileFromSession(sessionData.session);
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

  const executeWalletTransfer = async (
    userId: string,
    amount: number,
    type: 'top_up' | 'disbursement' | 'escrow_deposit' | 'escrow_release' | 'contribution' | 'refund' | 'transfer_in' | 'transfer_out',
    transactionId: string,
    metadata?: any,
    operator?: string
  ) => {
    const { data: walletData, error: fetchError } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
    if (fetchError) throw new Error("Could not fetch wallet balance.");

    const currentBalance = walletData.balance || 0;
    let newBalance = currentBalance;
    const isCredit = ['top_up', 'escrow_release', 'refund', 'transfer_in'].includes(type);

    if (isCredit) {
      newBalance += amount;
    } else {
      if (currentBalance < amount) throw new Error("Insufficient wallet balance.");
      newBalance -= amount;
    }

    const { error: walletError } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
    if (walletError) throw new Error("Failed to update wallet balance.");

    const { error: txError } = await supabase.from('transactions').upsert({
      id: transactionId,
      user_id: userId,
      amount,
      type,
      status: 'successful',
      pawapay_ref: transactionId,
      mno_provider: operator || null,
      metadata
    });
    if (txError) {
      console.error("TX ERROR:", txError);
      throw new Error(`Failed to record transaction: ${txError.message}`);
    }

    if (userId === user.id) {
      setWalletBalance(newBalance);
      await refreshData();
    }
  };

  const topUpWallet = async (amount: number, operator: 'MTN' | 'Orange'): Promise<string> => {
    const depositId = generateId();
    const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

    const { error: txError } = await supabase.from('transactions').insert({
      id: depositId, user_id: user.id, amount, type: 'top_up', status: 'pending', mno_provider: operator
    });
    if (txError) throw new Error(txError.message);

    await initiateDeposit({ depositId, phoneNumber: user.phone, provider, amount, note: "Wallet Top-up" });
    const finalStatus = await pollDepositUntilFinal(depositId);

    if (finalStatus.status === "COMPLETED") {
      await executeWalletTransfer(user.id, amount, 'top_up', depositId, finalStatus, operator);

      await Promise.all([
        createNotificationRecord('deposit', 'Wallet Top-up Successful', `Your wallet has been topped up by ${amount.toLocaleString()} XAF.`),
        presentLocalNotification('Top-up Successful', `Added ${amount.toLocaleString()} XAF to your wallet.`),
      ]);
      return depositId;
    } else {
      await supabase.from('transactions').update({ status: 'failed', metadata: finalStatus }).eq('id', depositId);
      throw new Error(`Deposit failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
    }
  };

  const withdrawFunds = async (amount: number, operator: 'MTN' | 'Orange'): Promise<string> => {
    try {
      if (amount > walletBalance) throw new Error("Insufficient wallet balance for withdrawal.");

      const payoutId = generateId();
      const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

      const { error: txError } = await supabase.from('transactions').insert({
        id: payoutId, user_id: user.id, amount, type: 'disbursement', status: 'pending', mno_provider: operator
      });
      if (txError) throw new Error(txError.message);

      await initiatePayout({ payoutId, phoneNumber: user.phone, provider, amount, note: "Wallet Withdrawal" });
      const finalStatus = await pollPayoutUntilFinal(payoutId);

      if (finalStatus.status === "COMPLETED") {
        await executeWalletTransfer(user.id, amount, 'disbursement', payoutId, finalStatus, operator);

        await Promise.all([
          createNotificationRecord('disbursement', 'Withdrawal Successful', `You withdrew ${amount.toLocaleString()} XAF to your ${operator} account.`),
          presentLocalNotification('Withdrawal Completed', `You withdrew ${amount.toLocaleString()} XAF.`),
        ]);
        return payoutId;
      } else {
        await supabase.from('transactions').update({ status: 'failed', metadata: finalStatus }).eq('id', payoutId);
        throw new Error(`Withdrawal failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("[withdrawFunds] Exception:", error);
      throw error;
    }
  };

  const sendMoney = async (amount: number, phone: string, operator: 'MTN' | 'Orange', note: string): Promise<string> => {
    try {
      if (amount > walletBalance) throw new Error("Insufficient wallet balance for this transfer.");

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const finalPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
      if (finalPhone === user.phone) throw new Error("You cannot send money to yourself.");
      const phonePlus = `+${finalPhone}`;

      const { data: recipientData } = await supabase
        .from('users')
        .select('id, full_name')
        .or(`phone.eq.${finalPhone},phone.eq.${phonePlus}`)
        .maybeSingle();

      const txId = generateId();

      if (recipientData && recipientData.id) {
        // Internal Transfer
        const txIdIn = generateId();
        await executeWalletTransfer(user.id, amount, 'transfer_out', txId, { recipientPhone: phone, recipientName: recipientData.full_name, note });
        await executeWalletTransfer(recipientData.id, amount, 'transfer_in', txIdIn, { senderPhone: user.phone, senderName: user.name, note });

        await Promise.all([
          createNotificationRecord('transfer_out', 'Transfer Sent', `You sent ${amount.toLocaleString()} XAF to ${recipientData.full_name}.`),
          presentLocalNotification('Transfer Completed', `You sent ${amount.toLocaleString()} XAF to ${recipientData.full_name}.`),
          createNotificationRecord('transfer_in', 'Transfer Received', `You received ${amount.toLocaleString()} XAF from ${user.name || user.phone}.`, recipientData.id),
        ]);
        return txId;
      } else {
        // External Payout via PawaPay
        const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

        const { error: txError } = await supabase.from('transactions').insert({
          id: txId, user_id: user.id, amount, type: 'disbursement', status: 'pending', mno_provider: operator
        });
        if (txError) throw new Error(txError.message);

        await initiatePayout({ payoutId: txId, phoneNumber: phone, provider, amount, note: note || "Wallet Transfer" });
        const finalStatus = await pollPayoutUntilFinal(txId);

        if (finalStatus.status === "COMPLETED") {
          await executeWalletTransfer(user.id, amount, 'disbursement', txId, finalStatus, operator);

          await Promise.all([
            createNotificationRecord('disbursement', 'Transfer Successful', `You sent ${amount.toLocaleString()} XAF to ${phone}.`),
            presentLocalNotification('Transfer Completed', `You sent ${amount.toLocaleString()} XAF to ${phone}.`),
          ]);
          return txId;
        } else {
          await supabase.from('transactions').update({ status: 'failed', metadata: finalStatus }).eq('id', txId);
          throw new Error(`Transfer failed: ${finalStatus.failureReason?.failureMessage || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error("[sendMoney] Exception:", error);
      throw error;
    }
  };

  const createCircle = async (
    name: string, type: 'solo' | 'pool' | 'rotation', goal: number, contribution: number, frequency: 'daily' | 'weekly' | 'monthly', maxMembers: number, visibility: 'public' | 'private' = 'private'
  ): Promise<{ id: string, name: string, code: string }> => {
    // Generate a random 6 character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: circleData, error: circleError } = await supabase.from('circles').insert({
      creator_id: user.id,
      name,
      goal_type: 'general',
      circle_type: type,
      target_amount: goal,
      contribution_amount: contribution,
      frequency,
      invite_code: code,
      visibility: visibility
    }).select().single();

    if (circleError) throw new Error(circleError.message);

    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: circleData.id,
      user_id: user.id,
      role: 'admin',
      rotation_order: 1,
      deposit_status: 'paid',
      member_status: 'active'
    });

    if (memberError) throw new Error(memberError.message);

    await refreshData();
    return { id: circleData.id, name: circleData.name, code: circleData.invite_code };
  };

  const joinCircleByCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    // 1. Find the circle by invite code
    const { data: circleData, error: fetchError } = await supabase.from('circles').select('id, name, circle_type, visibility').eq('invite_code', code).single();
    if (fetchError || !circleData) return { success: false, message: 'Invalid or inactive invite code' };

    // 2. Check if already a member
    const { data: existing } = await supabase.from('circle_members').select('id').eq('circle_id', circleData.id).eq('user_id', user.id).maybeSingle();
    if (existing) return { success: false, message: 'You are already a member of this circle' };

    // 3. Count current members to set rotation order
    const { count } = await supabase.from('circle_members').select('*', { count: 'exact', head: true }).eq('circle_id', circleData.id).neq('member_status', 'exited');
    const memberCount = count || 0;
    const isPrivate = circleData.visibility === 'private';

    // 4. Insert the user into circle_members with pending status for private circles
    const { error: insertError } = await supabase.from('circle_members').insert({
      circle_id: circleData.id,
      user_id: user.id,
      role: 'member',
      rotation_order: memberCount + 1,
      deposit_status: isPrivate ? 'pending' : circleData.circle_type === 'rotation' ? 'pending' : 'paid',
      member_status: isPrivate ? 'pending' : 'active'
    });

    if (insertError) return { success: false, message: insertError.message };

    await refreshData();

    if (isPrivate) {
      const { data: admins, error: adminError } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleData.id)
        .eq('role', 'admin');

      if (!adminError && admins?.length) {
        const notifications = admins.map((admin: any) => ({
          user_id: admin.user_id,
          type: 'circle_join_request',
          title: 'New join request',
          message: `${user.name || 'A member'} has requested to join ${circleData.name}.`,
        }));
        await supabase.from('notifications').insert(notifications);

        // Send push notifications to all admins
        for (const admin of admins) {
          try {
            await notifyAdminOfPendingMember(
              admin.user_id,
              user.name || 'A member',
              circleData.name,
              circleData.id
            );
          } catch (error) {
            console.warn("Failed to send push notification to admin:", error);
          }
        }
      }

      await Promise.all([
        createNotificationRecord(
          'circle_request',
          'Join Request Sent',
          `Your request to join ${circleData.name} is pending admin approval.`,
          user.id
        ),
        presentLocalNotification(
          'Join Request Pending',
          `Your request to join ${circleData.name} is awaiting approval.`
        ),
      ]);
      return { success: true, message: `Your request to join ${circleData.name} is pending approval.` };
    }

    return { success: true, message: `Successfully joined ${circleData.name}!` };
  };

  const approveCircleMember = async (memberId: string) => {
    // 1. Get the member details to know who to notify
    const { data: memberData, error: fetchError } = await supabase
      .from('circle_members')
      .select('user_id, circle_id, circles(name)')
      .eq('id', memberId)
      .single();

    if (fetchError) {
      console.warn("Could not retrieve member details for approval:", fetchError.message);
    }

    // 2. Approve the member
    const { error } = await supabase
      .from('circle_members')
      .update({ member_status: 'active' })
      .eq('id', memberId)
      .eq('member_status', 'pending');
    if (error) throw new Error(error.message);

    // 3. Create a notification for the approved user
    if (memberData) {
      let circleName = "a savings circle";
      if (memberData.circles) {
        if (Array.isArray(memberData.circles)) {
          circleName = memberData.circles[0]?.name || circleName;
        } else {
          circleName = (memberData.circles as any).name || circleName;
        }
      }
      const approvedUserId = memberData.user_id;

      // Create notification record
      await supabase.from("notifications").insert({
        user_id: approvedUserId,
        type: "circle_approved",
        title: "Join Request Approved",
        message: `Your request to join "${circleName}" has been approved by the admin. You are now an active member!`,
      });

      // Send push notification to the approved user
      try {
        await notifyUserOfApproval(approvedUserId, circleName, memberData.circle_id);
      } catch (error) {
        console.warn("Failed to send push notification to approved member:", error);
      }

      // Present local notification for immediate feedback
      await presentLocalNotification(
        "Join Request Approved",
        `Your request to join "${circleName}" has been approved!`
      );
    }

    await refreshData();
  };

  const payCircleContribution = async (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    if (circle.contributionAmount > walletBalance) throw new Error("Insufficient wallet balance. Please top up first.");

    const txId = generateId();

    const { error: insertError } = await supabase.from('contributions').insert({
      circle_id: circleId,
      user_id: user.id,
      pawapay_deposit_id: txId,
      amount: circle.contributionAmount,
      cycle_number: circle.currentRound,
      status: 'COMPLETED',
      due_at: new Date().toISOString()
    });
    if (insertError) throw new Error(insertError.message);

    await executeWalletTransfer(user.id, circle.contributionAmount, 'contribution', txId, { circle: circleId });

    await supabase.from('circle_members')
      .update({ deposit_status: 'paid' })
      .eq('circle_id', circleId)
      .eq('user_id', user.id);

    await refreshData();
  };

  const createEscrowContract = async (
    title: string,
    desc: string,
    amount: number,
    otherParty: string,
    role: "buyer" | "seller"
  ) => {
    // Parse counterparty input
    const cleanPhone = otherParty.replace(/[^0-9]/g, "");
    let formattedPhone = "";
    if (cleanPhone.length >= 9) {
      const basePhone = cleanPhone.length === 12 && cleanPhone.startsWith("237")
        ? cleanPhone.slice(3)
        : cleanPhone.slice(-9);
      formattedPhone = `+237${basePhone}`;
    }

    if (formattedPhone === user.phone) throw new Error("You cannot create an escrow with yourself.");

    let query = supabase.from('users').select('id');
    if (formattedPhone) {
      query = query.eq('phone', formattedPhone);
    } else {
      query = query.ilike('full_name', otherParty);
    }

    const { data: counterpartyUser, error: cpError } = await query.maybeSingle();
    if (cpError || !counterpartyUser?.id) {
      throw new Error("Counterparty user not found on MboaPay. Please verify their registered phone number or name.");
    }

    const contractId = generateId();

    if (role === 'buyer') {
      if (amount > walletBalance) throw new Error("Insufficient wallet balance. Please top up first.");

      await executeWalletTransfer(user.id, amount, 'escrow_deposit', contractId, { title });

      const { error: insertError } = await supabase.from('escrows').insert({
        id: contractId,
        sender_id: user.id,
        recipient_id: counterpartyUser.id,
        amount,
        description: `${title} - ${desc}`,
        status: 'locked'
      });
      if (insertError) throw new Error(insertError.message);
      await refreshData();
    } else {
      const { error: insertError } = await supabase.from('escrows').insert({
        id: contractId,
        sender_id: counterpartyUser.id, // The buyer
        recipient_id: user.id,          // The seller
        amount,
        description: `${title} - ${desc}`,
        status: 'pending_payment'
      });
      if (insertError) throw new Error(insertError.message);
      await refreshData();
    }
  };

  const lockEscrowFunds = async (escrowId: string) => {
    const escrow = escrows.find(e => e.id === escrowId);
    if (!escrow) throw new Error("Escrow contract not found");
    if (escrow.amount > walletBalance) throw new Error("Insufficient wallet balance. Please top up first.");

    await executeWalletTransfer(user.id, escrow.amount, 'escrow_deposit', escrowId, { escrow: escrowId });

    const { error: updateError } = await supabase
      .from('escrows')
      .update({ status: 'locked' })
      .eq('id', escrowId);

    if (updateError) throw new Error(updateError.message);
    await refreshData();
  };

  const releaseEscrowContract = async (escrowId: string) => {
    const { data: escrowData, error: fetchError } = await supabase.from('escrows').select('*').eq('id', escrowId).single();
    if (fetchError || !escrowData) throw new Error("Escrow not found");

    const releaseId = generateId();
    await executeWalletTransfer(escrowData.recipient_id, escrowData.amount, 'escrow_release', releaseId, { escrow: escrowId });

    const { error: updateError } = await supabase
      .from('escrows')
      .update({ status: 'released' })
      .eq('id', escrowId);

    if (updateError) throw new Error(updateError.message);
    await refreshData();
  };

  const disputeEscrowContract = async (escrowId: string) => {
    const { data: escrowData, error: fetchError } = await supabase.from('escrows').select('*').eq('id', escrowId).single();
    if (fetchError || !escrowData) throw new Error("Escrow not found");

    const refundId = generateId();
    await executeWalletTransfer(escrowData.sender_id, escrowData.amount, 'refund', refundId, { escrow: escrowId });

    const { error: updateError } = await supabase
      .from('escrows')
      .update({ status: 'refunded' })
      .eq('id', escrowId);

    if (updateError) throw new Error(updateError.message);
    await refreshData();
  };



  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .eq('user_id', user.id);
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
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
        theme,
        colors,
        toggleTheme,
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
        withdrawFunds,
        sendMoney,
        createCircle,
        joinCircleByCode,
        approveCircleMember,
        payCircleContribution,
        createEscrowContract,
        lockEscrowFunds,
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

