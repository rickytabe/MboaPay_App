import { Session } from "@supabase/supabase-js";
import { Dispatch, SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import { AppNotification, Circle, Escrow, Transaction, UserProfile } from "./AppContext";

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const mapTransaction = (tx: any): Transaction => ({
  id: tx.id,
  type: tx.type,
  amount: tx.amount,
  status: tx.status,
  date: formatTimestamp(tx.created_at),
  title: tx.type.replace(/_/g, " ").toUpperCase(),
  subtitle: tx.description || tx.metadata?.recipientName || tx.metadata?.senderName || "MboaPay Transaction",
  operator: tx.metadata?.operator || "MTN",
  metadata: tx.metadata || {},
  created_at: tx.created_at,
});

const mapNotification = (notif: any): AppNotification => ({
  id: notif.id,
  title: notif.message.split("\n")[0].replace(/\*\*/g, ""),
  type: notif.type,
  message: notif.message || "",
  date: formatTimestamp(notif.created_at),
  read: notif.read || false,
});

const mapCircle = async (circle: any, currentUserId: string): Promise<Circle> => {
  const me = circle.circle_members?.find((member: any) => member.user_id === currentUserId);
  const inactiveMemberStatuses = new Set(["exited", "removed", "rejected"]);
  const isCurrentMember = Boolean(me && !inactiveMemberStatuses.has(me.member_status));
  
  const mappedMembers = await Promise.all((circle.circle_members || []).map(async (member: any) => {
    let finalAvatarUrl = member.users?.avatar_url || "";
    if (finalAvatarUrl && !finalAvatarUrl.startsWith("http")) {
      const { data: signedUrlData } = await supabase.storage.from("User_avaters").createSignedUrl(finalAvatarUrl, 60 * 60 * 24 * 7);
      if (signedUrlData?.signedUrl) {
        finalAvatarUrl = signedUrlData.signedUrl;
      }
    }
    return {
      id: member.id,
      name: member.user_id === currentUserId ? (member.member_status === 'pending' ? "You (Pending)" : "You") : member.users?.full_name || "Member",
      role: member.role || "member",
      paid: member.deposit_status === "paid",
      isPayout: false,
      avatar: finalAvatarUrl,
      status: member.member_status,
      isPending: member.member_status === 'pending',
    };
  }));

  let totalContributed = 0;
  if (circle.contributions && Array.isArray(circle.contributions)) {
    totalContributed = circle.contributions
      .filter((c: any) => c.status === 'successful')
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  }

  return {
    id: circle.id,
    name: circle.name,
    type: circle.circle_type === "rotation" ? "Tontine" : "Goal",
    createdAt: circle.created_at,
    joinedAt: me?.created_at,
    updatedAt: circle.updated_at,
    goalAmount: circle.target_amount,
    contributionAmount: circle.contribution_amount,
    membersCount: mappedMembers.length,
    nextPayoutDate: "TBD",
    status: me?.deposit_status === "paid" ? "Paid" : "Pending",
    members: mappedMembers,
    frequency: circle.frequency || "monthly",
    currentRound: circle.current_round || 1,
    maxMembers: circle.max_members || mappedMembers.length,
    code: circle.invite_code || "",
    isTreasurer: me?.role === "treasurer",
    isMember: isCurrentMember,
    visibility: circle.visibility || "private",
    rawType: circle.circle_type,
    totalContributed,
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
    created_at: escrow.created_at,
  };
};

const isProfileComplete = (name?: string | null, phone?: string | null) => {
  const trimmedName = name?.trim();
  const trimmedPhone = phone?.trim();
  return Boolean(trimmedName && trimmedName !== "New User" && trimmedPhone && trimmedPhone.length >= 9);
};

export const fetchWalletBalance = async (userId: string): Promise<number> => {
  const { data } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
  return data?.balance || 0;
};

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data } = await supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ? data.map(mapTransaction) : [];
};

export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
  const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ? data.map(mapNotification) : [];
};

export const fetchCircles = async (userId: string): Promise<Circle[]> => {
  const { data: memberData } = await supabase.from("circle_members").select("circle_id").eq("user_id", userId);
  const circleIds = memberData ? memberData.map(m => m.circle_id) : [];

  let query = supabase.from("circles").select("*, circle_members(*, users(id, full_name, avatar_url)), contributions(amount, status)");
  
  if (circleIds.length > 0) {
    query = query.or(`id.in.(${circleIds.join(',')}),visibility.eq.public`);
  } else {
    query = query.eq("visibility", "public");
  }

  const { data } = await query;
  if (!data) return [];
  
  const circles = await Promise.all(data.map(async (circle: any) => await mapCircle(circle, userId)));
  return circles;
};

export const fetchEscrows = async (userId: string): Promise<Escrow[]> => {
  const { data } = await supabase.from("escrows").select("*, sender:users!sender_id(full_name, phone, avatar_url), recipient:users!recipient_id(full_name, phone, avatar_url)").or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
  return data ? data.map((escrow: any) => mapEscrow(escrow, userId)) : [];
};

export const syncProfileFromSession = async (
  session: Session | null,
  setAuthSession: Dispatch<SetStateAction<Session | null>>,
  setUser: Dispatch<SetStateAction<UserProfile>>,
  INITIAL_USER: UserProfile
) => {
  setAuthSession(session);

  if (!session) {
    setUser(INITIAL_USER);
    return false;
  }

  const authUser = session.user;
  const metadata = authUser.user_metadata || {};
  const metadataEmail = typeof metadata.email === "string" ? metadata.email : "";
  let avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";

  const { data: profile, error } = await supabase
    .from("users")
    .select("full_name, phone, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.warn("Could not load Supabase profile:", error.message);
  }

  const fullName = profile?.full_name || "";
  const userPhone = profile?.phone || authUser.phone || "";
  const completedProfile = isProfileComplete(fullName, userPhone);

  if (profile?.avatar_url) {
    if (profile.avatar_url.startsWith("http")) {
      avatarUrl = profile.avatar_url;
    } else {
      const { data: signedUrlData } = await supabase.storage.from("User_avaters").createSignedUrl(profile.avatar_url, 60 * 60 * 24 * 7);
      if (signedUrlData?.signedUrl) {
        avatarUrl = signedUrlData.signedUrl;
      }
    }
  }

  setUser((prev) => ({
    ...prev,
    id: authUser.id,
    name: completedProfile ? fullName : "",
    phone: profile?.phone || authUser.phone || prev.phone,
    email: metadataEmail || prev.email,
    avatarUrl: avatarUrl || prev.avatarUrl,
    isLoggedIn: completedProfile,
  }));

  return completedProfile;
};
