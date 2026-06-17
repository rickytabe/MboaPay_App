import type { Dispatch, SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AppNotification, Circle, Escrow, Transaction, UserProfile } from "./types";

const formatTimestamp = (value?: string | Date | null) =>
  new Date(value ?? new Date()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", "");

const mapTransaction = (tx: any): Transaction => {
  const dateStr = formatTimestamp(tx.created_at);
  let title = "Transaction";
  let subtitle = "";

  if (tx.type === "deposit" || tx.type === "top_up") {
    title = "Mobile Money Deposit";
    subtitle = `Deposited from ${tx.mno_provider || "Mobile"}`;
  } else if (tx.type === "payout") {
    title = "Payout";
    subtitle = "Disbursed to wallet";
  } else if (tx.type === "contribution") {
    title = "Circle Contribution";
    subtitle = "Paid to circle";
  } else if (tx.type === "escrow_deposit") {
    title = "Escrow Funds Locked";
    subtitle = "Locked for contract";
  } else if (tx.type === "escrow_release") {
    title = "Escrow Funds Released";
    subtitle = "Escrow released";
  } else if (tx.type === "refund") {
    title = "Refund";
    subtitle = "Funds returned";
  } else if (tx.type === "transfer_out") {
    title = "Transfer Sent";
    subtitle = tx.metadata?.recipientName ? `Sent to ${tx.metadata.recipientName}` : "Internal transfer";
  } else if (tx.type === "transfer_in") {
    title = "Transfer Received";
    subtitle = tx.metadata?.senderName ? `From ${tx.metadata.senderName}` : "Internal transfer";
  } else if (tx.type === "disbursement") {
    title = "Withdrawal";
    subtitle = "To Mobile Money";
  }

  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    title,
    subtitle,
    date: dateStr,
    operator: tx.mno_provider,
    status: tx.status === "successful" ? "success" : tx.status,
    metadata: tx.metadata,
  };
};

const mapNotification = (notification: any): AppNotification => ({
  id: notification.id,
  type: notification.type,
  title: notification.type.replace("_", " ").toUpperCase(),
  message: notification.message,
  date: formatTimestamp(notification.created_at),
  read: notification.read,
});

const mapCircle = (circle: any, currentUserId: string): Circle => {
  const me = circle.circle_members?.find((member: any) => member.user_id === currentUserId);
  const mappedMembers = (circle.circle_members || []).map((member: any) => ({
    id: member.id,
    name: member.user_id === currentUserId ? (member.member_status === 'pending' ? "You (Pending)" : "You") : member.users?.full_name || "Member",
    role: member.role || "member",
    paid: member.deposit_status === "paid",
    isPayout: false,
    avatar: `https://i.pravatar.cc/150?u=${member.users?.id || member.id}`,
    status: member.member_status,
    isPending: member.member_status === 'pending',
  }));

  return {
    id: circle.id,
    name: circle.name,
    type: circle.circle_type === "rotation" ? "Tontine" : "Goal",
    goalAmount: circle.target_amount,
    contributionAmount: circle.contribution_amount,
    frequency: circle.frequency,
    nextPayoutDate: "Upcoming",
    membersCount: circle.circle_members.length,
    currentRound: 1,
    maxMembers: 10,
    status: circle.status,
    code: circle.invite_code,
    isTreasurer: me?.role === "admin",
    isMember: !!me,
    visibility: circle.visibility || 'private',
    members: mappedMembers,
  };
};

const mapEscrow = (escrow: any, currentUserId: string): Escrow => {
  const isBuyer = escrow.sender_id === currentUserId;
  const otherUser = isBuyer ? escrow.recipient : escrow.sender;
  return {
    id: escrow.id,
    title: escrow.description || "Escrow Contract",
    description: escrow.description || "",
    role: isBuyer ? "buyer" : "seller",
    amount: escrow.amount,
    otherParty: otherUser?.full_name || otherUser?.phone || (isBuyer ? "Seller" : "Buyer"),
    otherPartyPhone: otherUser?.phone || "",
    status: escrow.status,
    date: formatTimestamp(escrow.created_at),
    code: escrow.id.substring(0, 8).toUpperCase(),
  };
};

const isProfileComplete = (name?: string | null, phone?: string | null) => {
  const trimmedName = name?.trim();
  const trimmedPhone = phone?.trim();
  return Boolean(trimmedName && trimmedName !== "New User" && trimmedPhone && trimmedPhone.length >= 9);
};

export const loadAppData = async (
  currentUserId: string,
  setWalletBalance: Dispatch<SetStateAction<number>>,
  setTransactions: Dispatch<SetStateAction<Transaction[]>>,
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>,
  setCircles: Dispatch<SetStateAction<Circle[]>>,
  setEscrows: Dispatch<SetStateAction<Escrow[]>>
) => {
  const { data: walletData } = await supabase.from("wallets").select("balance").eq("user_id", currentUserId).single();
  if (walletData) setWalletBalance(walletData.balance);

  const { data: txData } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
  if (txData) setTransactions(txData.map(mapTransaction));

  const { data: notifData } = await supabase.from("notifications").select("*").eq("user_id", currentUserId).order("created_at", { ascending: false });
  if (notifData) setNotifications(notifData.map(mapNotification));

  const { data: circlesData, error: circlesError } = await supabase.from("circles").select("*, circle_members(*, users(id, full_name))");
  if (circlesError) console.error("Circles fetch error:", circlesError);
  if (circlesData) setCircles(circlesData.map((circle: any) => mapCircle(circle, currentUserId)));

  const { data: escrowsData } = await supabase
    .from("escrows")
    .select("*, sender:users!sender_id(full_name, phone), recipient:users!recipient_id(full_name, phone)");
  if (escrowsData) setEscrows(escrowsData.map((escrow: any) => mapEscrow(escrow, currentUserId)));
};

export const subscribeToAppData = (currentUserId: string, fetchAppData: (userId: string) => Promise<void>) => {
  const transactionsChannel = supabase
    .channel('transactions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${currentUserId}` }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  const contributionsChannel = supabase
    .channel('contributions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `user_id=eq.${currentUserId}` }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  const circlesChannel = supabase
    .channel('circles-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'circles' }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  const circleMembersChannel = supabase
    .channel('circle_members-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members' }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  const escrowsChannel = supabase
    .channel('escrows-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'escrows' }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  const walletsChannel = supabase
    .channel('wallets-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${currentUserId}` }, () => {
      void fetchAppData(currentUserId);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(transactionsChannel);
    void supabase.removeChannel(contributionsChannel);
    void supabase.removeChannel(circlesChannel);
    void supabase.removeChannel(circleMembersChannel);
    void supabase.removeChannel(escrowsChannel);
    void supabase.removeChannel(walletsChannel);
  };
};

export const syncProfileFromSession = async (
  session: Session | null,
  setAuthSession: Dispatch<SetStateAction<Session | null>>,
  setUser: Dispatch<SetStateAction<UserProfile>>,
  fetchAppData: (userId: string) => Promise<void>,
  initialUser: UserProfile
) => {
  setAuthSession(session);

  if (!session) {
    setUser(initialUser);
    return false;
  }

  const authUser = session.user;
  const metadata = authUser.user_metadata || {};
  const metadataEmail = typeof metadata.email === "string" ? metadata.email : "";
  const metadataAvatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";

  const { data: profile, error } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.warn("Could not load Supabase profile:", error.message);
  }

  const fullName = profile?.full_name || "";
  const userPhone = profile?.phone || authUser.phone || "";
  const completedProfile = isProfileComplete(fullName, userPhone);

  setUser((prev) => ({
    ...prev,
    id: authUser.id,
    name: completedProfile ? fullName : "",
    phone: profile?.phone || authUser.phone || prev.phone,
    email: metadataEmail || prev.email,
    avatarUrl: metadataAvatarUrl || prev.avatarUrl,
    isLoggedIn: completedProfile,
  }));

  if (completedProfile) {
    await fetchAppData(authUser.id);
  }

  return completedProfile;
};
