import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'send' | 'receive' | 'escrow_lock' | 'escrow_release' | 'tontine_payout' | 'tontine_pay';
  amount: number;
  title: string;
  subtitle: string;
  date: string;
  operator?: 'MTN' | 'Orange';
  status: 'success' | 'pending' | 'failed';
}

export interface CircleMember {
  name: string;
  paid: boolean;
  isPayout: boolean;
  avatar: string;
}

export interface Circle {
  id: string;
  name: string;
  type: 'Tontine' | 'Goal';
  goalAmount: number;
  contributionAmount: number;
  frequency: 'Weekly' | 'Monthly';
  nextPayoutDate: string;
  membersCount: number;
  currentRound: number;
  maxMembers: number;
  status: 'active' | 'completed';
  code: string;
  isTreasurer: boolean;
  members: CircleMember[];
}

export interface Escrow {
  id: string;
  title: string;
  description: string;
  role: 'buyer' | 'seller';
  amount: number;
  otherParty: string;
  status: 'pending_payment' | 'locked' | 'disputed' | 'released';
  date: string;
  code: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

interface AppContextType {
  user: UserProfile;
  walletBalance: number;
  selectedOperator: 'MTN' | 'Orange';
  transactions: Transaction[];
  circles: Circle[];
  escrows: Escrow[];
  notifications: AppNotification[];
  login: (phone: string) => void;
  verifyOtp: () => void;
  updateProfile: (name: string, email: string) => void;
  setOperator: (op: 'MTN' | 'Orange') => void;
  topUpWallet: (amount: number, operator: 'MTN' | 'Orange') => Promise<string>;
  createCircle: (name: string, type: 'Tontine' | 'Goal', goal: number, contribution: number, frequency: 'Weekly' | 'Monthly', maxMembers: number) => string;
  joinCircleByCode: (code: string) => { success: boolean; message: string };
  payCircleContribution: (circleId: string) => void;
  createEscrowContract: (title: string, desc: string, amount: number, otherParty: string, role: 'buyer' | 'seller') => void;
  releaseEscrowContract: (escrowId: string) => void;
  disputeEscrowContract: (escrowId: string) => void;
  markNotificationsAsRead: () => void;
  resetAppState: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  name: "",
  phone: "",
  email: "",
  avatarUrl: "https://i.pravatar.cc/150?img=11",
  isLoggedIn: false,
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-001",
    type: "deposit",
    amount: 15000,
    title: "Mobile Money Deposit",
    subtitle: "Deposited from MTN Wallet",
    date: "14 Jun, 10:30 AM",
    operator: "MTN",
    status: "success",
  },
  {
    id: "tx-002",
    type: "tontine_pay",
    amount: 5000,
    title: "Tontine Contribution",
    subtitle: "Paid to Njangi Family Circle",
    date: "12 Jun, 06:15 PM",
    status: "success",
  },
  {
    id: "tx-003",
    type: "send",
    amount: 2500,
    title: "Funds Transfer",
    subtitle: "Sent to Frankline",
    date: "10 Jun, 02:45 PM",
    status: "success",
  },
];

const INITIAL_CIRCLES: Circle[] = [
  {
    id: "circle-001",
    name: "Njangi Family Circle",
    type: "Tontine",
    goalAmount: 60000,
    contributionAmount: 5000,
    frequency: "Weekly",
    nextPayoutDate: "In 2 days (17 Jun)",
    membersCount: 12,
    currentRound: 4,
    maxMembers: 12,
    status: "active",
    code: "MBOA-4982",
    isTreasurer: false,
    members: [
      { name: "John Doe", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=12" },
      { name: "You (Pending)", paid: false, isPayout: false, avatar: "https://i.pravatar.cc/150?img=11" },
      { name: "Amadou Toure", paid: true, isPayout: true, avatar: "https://i.pravatar.cc/150?img=13" },
      { name: "Saliou Diallo", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=14" },
      { name: "Clarisse E.", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=15" },
    ],
  },
  {
    id: "circle-002",
    name: "Douala Market Group",
    type: "Goal",
    goalAmount: 250000,
    contributionAmount: 15000,
    frequency: "Monthly",
    nextPayoutDate: "In 15 days (30 Jun)",
    membersCount: 8,
    currentRound: 1,
    maxMembers: 10,
    status: "active",
    code: "MBOA-7719",
    isTreasurer: true,
    members: [
      { name: "You", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=11" },
      { name: "Alain N.", paid: true, isPayout: true, avatar: "https://i.pravatar.cc/150?img=21" },
      { name: "Beatrice K.", paid: false, isPayout: false, avatar: "https://i.pravatar.cc/150?img=22" },
      { name: "Dieudonne M.", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=23" },
    ],
  },
];

const INITIAL_ESCROWS: Escrow[] = [
  {
    id: "escrow-001",
    title: "MacBook Air purchase",
    description: "Purchase of a MacBook Air M1, 8GB, 256GB SSD in pristine condition.",
    role: "buyer",
    amount: 350000,
    otherParty: "Sani Electronics (+237 677 889 900)",
    status: "locked",
    date: "14 Jun, 09:12 AM",
    code: "ESC-8921",
  },
  {
    id: "escrow-002",
    title: "Logo Design Service",
    description: "Creating a premium corporate identity logo and branding guide.",
    role: "seller",
    amount: 50000,
    otherParty: "Kamga Retail (+237 699 112 233)",
    status: "pending_payment",
    date: "15 Jun, 11:00 AM",
    code: "ESC-3051",
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "not-001",
    title: "Njangi Round Completed",
    body: "Round 3 of Njangi Family Circle has been paid out to Amadou Toure.",
    date: "12 Jun, 06:30 PM",
    read: false,
  },
  {
    id: "not-002",
    title: "Top-up Successful",
    body: "Successfully loaded 15,000 XAF via MTN Mobile Money.",
    date: "14 Jun, 10:31 AM",
    read: true,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [walletBalance, setWalletBalance] = useState<number>(35200);
  const [selectedOperator, setSelectedOperator] = useState<'MTN' | 'Orange'>('MTN');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [circles, setCircles] = useState<Circle[]>(INITIAL_CIRCLES);
  const [escrows, setEscrows] = useState<Escrow[]>(INITIAL_ESCROWS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const login = (phone: string) => {
    setUser((prev) => ({ ...prev, phone }));
  };

  const verifyOtp = () => {
    // Advances status
  };

  const updateProfile = (name: string, email: string) => {
    setUser((prev) => ({
      ...prev,
      name,
      email,
      isLoggedIn: true,
    }));
  };

  const setOperator = (op: 'MTN' | 'Orange') => {
    setSelectedOperator(op);
  };

  const topUpWallet = (amount: number, operator: 'MTN' | 'Orange'): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const txId = `tx-${Math.floor(100 + Math.random() * 900)}`;
        const dateStr = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).replace(",", "");

        const newTx: Transaction = {
          id: txId,
          type: "deposit",
          amount,
          title: "Mobile Money Deposit",
          subtitle: `Deposited from ${operator} Wallet`,
          date: dateStr,
          operator,
          status: "success",
        };

        setWalletBalance((prev) => prev + amount);
        setTransactions((prev) => [newTx, ...prev]);
        setNotifications((prev) => [
          {
            id: `not-${Math.random().toString(36).substr(2, 9)}`,
            title: "Deposit Successful",
            body: `You have successfully loaded ${amount.toLocaleString()} XAF using ${operator} Money.`,
            date: "Just now",
            read: false,
          },
          ...prev,
        ]);
        resolve(txId);
      }, 2000); // Simulated delay for USSD approval
    });
  };

  const createCircle = (
    name: string,
    type: 'Tontine' | 'Goal',
    goal: number,
    contribution: number,
    frequency: 'Weekly' | 'Monthly',
    maxMembers: number
  ): string => {
    const id = `circle-${Math.floor(100 + Math.random() * 900)}`;
    const code = `MBOA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCircle: Circle = {
      id,
      name,
      type,
      goalAmount: goal,
      contributionAmount: contribution,
      frequency,
      nextPayoutDate: frequency === "Weekly" ? "In 7 days" : "In 30 days",
      membersCount: 1,
      currentRound: 1,
      maxMembers,
      status: "active",
      code,
      isTreasurer: true,
      members: [
        { name: user.name || "You", paid: true, isPayout: false, avatar: user.avatarUrl },
      ],
    };

    setCircles((prev) => [...prev, newCircle]);
    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Circle Created",
        body: `Your savings circle "${name}" was created successfully! Share the code ${code} to invite members.`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);

    return id;
  };

  const joinCircleByCode = (code: string): { success: boolean; message: string } => {
    // Normalize code comparison
    const matchCode = code.trim().toUpperCase();
    if (!matchCode.startsWith("MBOA-")) {
      return { success: false, message: "Invalid invite code structure." };
    }

    // Check if user is already a member of a circle with this code
    const alreadyJoined = circles.find((c) => c.code.toUpperCase() === matchCode);
    if (alreadyJoined) {
      return { success: false, message: "You are already a member of this circle." };
    }

    // Mock circle lookup & addition
    const circleNames = ["Bafoussam Traders Njangi", "Yaounde Tech Savings", "West Region Community Goal"];
    const randomName = circleNames[Math.floor(Math.random() * circleNames.length)];
    const contribution = 10000;
    
    const newCircle: Circle = {
      id: `circle-${Math.floor(100 + Math.random() * 900)}`,
      name: randomName,
      type: "Tontine",
      goalAmount: 100000,
      contributionAmount: contribution,
      frequency: "Weekly",
      nextPayoutDate: "In 4 days",
      membersCount: 6,
      currentRound: 1,
      maxMembers: 10,
      status: "active",
      code: matchCode,
      isTreasurer: false,
      members: [
        { name: "Eric N.", paid: true, isPayout: true, avatar: "https://i.pravatar.cc/150?img=3" },
        { name: "Felicite M.", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=4" },
        { name: "Pascal T.", paid: true, isPayout: false, avatar: "https://i.pravatar.cc/150?img=5" },
        { name: "You", paid: false, isPayout: false, avatar: user.avatarUrl },
      ],
    };

    setCircles((prev) => [...prev, newCircle]);
    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Joined Savings Circle",
        body: `You joined "${randomName}" savings circle. Your first contribution is due soon.`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);

    return { success: true, message: `Successfully joined ${randomName}!` };
  };

  const payCircleContribution = (circleId: string) => {
    const circle = circles.find((c) => c.id === circleId);
    if (!circle) return;

    if (walletBalance < circle.contributionAmount) {
      alert("Insufficient wallet balance. Please top up your wallet first.");
      return;
    }

    setWalletBalance((prev) => prev - circle.contributionAmount);

    // Update Circle Members state
    setCircles((prev) =>
      prev.map((c) => {
        if (c.id === circleId) {
          const updatedMembers = c.members.map((m) => {
            if (m.name === "You" || m.name === "You (Pending)") {
              return { ...m, name: "You", paid: true };
            }
            return m;
          });
          return { ...c, members: updatedMembers };
        }
        return c;
      })
    );

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");

    const newTx: Transaction = {
      id: `tx-${Math.floor(100 + Math.random() * 900)}`,
      type: "tontine_pay",
      amount: circle.contributionAmount,
      title: "Tontine Contribution",
      subtitle: `Paid to ${circle.name}`,
      date: dateStr,
      status: "success",
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Contribution Paid",
        body: `Successfully contributed ${circle.contributionAmount.toLocaleString()} XAF to "${circle.name}".`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const createEscrowContract = (
    title: string,
    desc: string,
    amount: number,
    otherParty: string,
    role: 'buyer' | 'seller'
  ) => {
    const id = `escrow-${Math.floor(100 + Math.random() * 900)}`;
    const code = `ESC-${Math.floor(1000 + Math.random() * 9000)}`;

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");

    const newEscrow: Escrow = {
      id,
      title,
      description: desc,
      role,
      amount,
      otherParty,
      status: role === "buyer" ? "locked" : "pending_payment",
      date: dateStr,
      code,
    };

    if (role === "buyer") {
      if (walletBalance < amount) {
        alert("Insufficient wallet balance to secure this escrow contract. Please top up.");
        return;
      }
      setWalletBalance((prev) => prev - amount);

      const newTx: Transaction = {
        id: `tx-${Math.floor(100 + Math.random() * 900)}`,
        type: "escrow_lock",
        amount,
        title: "Escrow Funds Locked",
        subtitle: `Locked for contract: ${title}`,
        date: dateStr,
        status: "success",
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    setEscrows((prev) => [...prev, newEscrow]);
    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Escrow Agreement Created",
        body: `Escrow contract "${title}" has been successfully established. Code: ${code}.`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const releaseEscrowContract = (escrowId: string) => {
    const item = escrows.find((e) => e.id === escrowId);
    if (!item) return;

    setEscrows((prev) =>
      prev.map((e) => {
        if (e.id === escrowId) {
          return { ...e, status: "released" };
        }
        return e;
      })
    );

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");

    if (item.role === "seller") {
      setWalletBalance((prev) => prev + item.amount);

      const newTx: Transaction = {
        id: `tx-${Math.floor(100 + Math.random() * 900)}`,
        type: "receive",
        amount: item.amount,
        title: "Escrow Funds Received",
        subtitle: `Released from contract: ${item.title}`,
        date: dateStr,
        status: "success",
      };
      setTransactions((prev) => [newTx, ...prev]);
    } else {
      // If we are buyer, we release it to the seller, so we don't get the balance back.
      const newTx: Transaction = {
        id: `tx-${Math.floor(100 + Math.random() * 900)}`,
        type: "escrow_release",
        amount: item.amount,
        title: "Escrow Funds Released",
        subtitle: `Released to seller for: ${item.title}`,
        date: dateStr,
        status: "success",
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Escrow Funds Released",
        body: `Funds for "${item.title}" have been successfully released.`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const disputeEscrowContract = (escrowId: string) => {
    setEscrows((prev) =>
      prev.map((e) => {
        if (e.id === escrowId) {
          return { ...e, status: "disputed" };
        }
        return e;
      })
    );
    setNotifications((prev) => [
      {
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        title: "Escrow Under Dispute",
        body: `A dispute has been raised for the escrow contract. MboaPay support will arbitrate.`,
        date: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetAppState = () => {
    setUser(INITIAL_USER);
    setWalletBalance(35200);
    setTransactions(INITIAL_TRANSACTIONS);
    setCircles(INITIAL_CIRCLES);
    setEscrows(INITIAL_ESCROWS);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const logout = () => {
    setUser((prev) => ({ ...prev, isLoggedIn: false }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        walletBalance,
        selectedOperator,
        transactions,
        circles,
        escrows,
        notifications,
        login,
        verifyOtp,
        updateProfile,
        setOperator,
        topUpWallet,
        createCircle,
        joinCircleByCode,
        payCircleContribution,
        createEscrowContract,
        releaseEscrowContract,
        disputeEscrowContract,
        markNotificationsAsRead,
        resetAppState,
        logout,
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
