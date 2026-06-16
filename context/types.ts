import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  title: string;
  subtitle: string;
  date: string;
  operator?: string;
  status: string;
}

export interface CircleMember {
  name: string;
  role?: string;
  paid: boolean;
  isPayout: boolean;
  avatar: string;
}

export interface Circle {
  id: string;
  name: string;
  type: string;
  goalAmount: number;
  contributionAmount: number;
  frequency: string;
  nextPayoutDate: string;
  membersCount: number;
  currentRound: number;
  maxMembers: number;
  status: string;
  code: string;
  isTreasurer: boolean;
  members: CircleMember[];
}

export interface Escrow {
  id: string;
  title: string;
  description: string;
  role: "buyer" | "seller";
  amount: number;
  otherParty: string;
  status: string;
  date: string;
  code: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface AppContextType {
  user: UserProfile;
  authSession: Session | null;
  hasAuthSession: boolean;
  isAuthLoading: boolean;
  walletBalance: number;
  selectedOperator: "MTN" | "Orange";
  transactions: Transaction[];
  circles: Circle[];
  escrows: Escrow[];
  notifications: AppNotification[];
  pendingEmail: string;
  login: (phone: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ needsProfileSetup: boolean }>;
  registerWithEmail: (email: string, pass: string, fullName: string, phone: string, mnoProvider?: string) => Promise<{ pendingEmail: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ needsProfileSetup: boolean }>;
  updateProfile: (name: string, email: string, avatarUrl?: string, phone?: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  setOperator: (op: "MTN" | "Orange") => void;
  topUpWallet: (amount: number, operator: "MTN" | "Orange") => Promise<string>;
  sendMoney: (amount: number, phone: string, operator: "MTN" | "Orange", note: string) => Promise<string>;
  createCircle: (name: string, type: "Tontine" | "Goal", goal: number, contribution: number, frequency: "Weekly" | "Monthly", maxMembers: number) => Promise<{ id: string; name: string; code: string }>;
  joinCircleByCode: (code: string) => Promise<{ success: boolean; message: string }>;
  payCircleContribution: (circleId: string) => Promise<void>;
  createEscrowContract: (title: string, desc: string, amount: number, otherParty: string, role: "buyer" | "seller") => Promise<void>;
  releaseEscrowContract: (escrowId: string) => Promise<void>;
  disputeEscrowContract: (escrowId: string) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  resetAppState: () => void;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}
