// MboaPay Transaction Vocabulary & Rendering Rules

/**
 * Transaction History Rules:
 *
 * 1. Display transactions in reverse chronological order.
 *    - The most recent transaction should always appear at the top.
 *    - Older transactions should appear below newer ones.
 *
 * 2. Sort transactions by their creation timestamp in descending order:
 *
 *    transactions.sort(
 *      (a, b) =>
 *        new Date(b.created_at).getTime() -
 *        new Date(a.created_at).getTime()
 *    );
 *
 * 3. Format amounts consistently:
 *    - Credits (money added): prefix with "+" and display in green.
 *    - Debits (money deducted): prefix with "-" and display in red.
 *
 * 4. Display each transaction using this layout:
 *
 *    [Icon] [Title]                       [Amount]
 *           [Context/Counterparty]
 *           [Time]
 *
 *    Examples:
 *    - Sent: "To: Sarah N."
 *    - Received: "From: John T."
 *    - Cash In: "MTN Mobile Money"
 *    - Cash Out: "To Orange Money"
 *    - Escrow: "Order #1024"
 *    - Contribution: "Mboa Women's Tontine"
 *
 * 5. Recommended: Group transactions by date labels such as:
 *    - Today
 *    - Yesterday
 *    - 12 June 2026
 *
 * 6. Empty State:
 *    If there are no transactions, show:
 *    "No transactions yet.
 *     Your transaction history will appear here once you start using MboaPay."
 */

export const TRANSACTION_TYPES = {
  // MONEY IN (Credits)
  top_up: {
    title: "Cash In",
    icon: "WalletCards",
    bgColor: "rgba(0, 109, 67, 0.08)", // Light green using COLORS.secondary
    iconColor: "text-green-600",
    description: "Added money to your MboaPay wallet."
  },

  transfer_in: {
    title: "Received",
    icon: "ArrowDownLeft",
    bgColor: "rgba(37, 99, 235, 0.08)", // Light blue
    iconColor: "text-blue-600",
    description: "Received money from another MboaPay user."
  },

  escrow_release: {
    title: "Escrow Received",
    icon: "ShieldCheck",
    bgColor: "rgba(124, 58, 237, 0.08)", // Light violet
    iconColor: "text-violet-600",
    description: "Received funds from a completed escrow transaction."
  },

  refund: {
    title: "Refund",
    icon: "RotateCcw",
    bgColor: "rgba(234, 88, 12, 0.08)", // Light orange
    iconColor: "text-orange-600",
    description: "Money returned to your wallet."
  },

  // MONEY OUT (Debits)
  disbursement: {
    title: "Cash Out",
    icon: "BanknoteArrowDown", // Fallback: ArrowUpRight
    bgColor: "rgba(186, 26, 26, 0.08)", // Light red using COLORS.error
    iconColor: "text-red-600",
    description: "Withdrawn from your MboaPay wallet to Mobile Money."
  },

  transfer_out: {
    title: "Sent",
    icon: "ArrowUpRight",
    bgColor: "rgba(37, 99, 235, 0.08)", // Light blue
    iconColor: "text-blue-600",
    description: "Sent money to another MboaPay user."
  },

  escrow_deposit: {
    title: "Escrow Payment",
    icon: "Shield",
    bgColor: "rgba(124, 58, 237, 0.08)", // Light violet
    iconColor: "text-violet-600",
    description: "Funds placed into escrow for a secure transaction."
  },

  contribution: {
    title: "Contribution",
    icon: "Users",
    bgColor: "rgba(217, 119, 6, 0.08)", // Light amber
    iconColor: "text-amber-600",
    description: "Contribution made to a tontine or savings group."
  }
};

import { COLORS } from "./Theme";

export type TransactionTypeKey = keyof typeof TRANSACTION_TYPES;

export const getTransactionStyle = (type: string) => {
  const info = TRANSACTION_TYPES[type as TransactionTypeKey] || {
    title: "Transaction",
    icon: "swap-horizontal-outline",
    bgColor: "rgba(0, 0, 0, 0.05)",
    iconColor: "text-gray-600",
    description: "Transaction details"
  };

  let ionicIcon: any = "swap-horizontal-outline";
  let color = COLORS.outline;
  let bgColor = COLORS.surfaceContainer;
  const isCredit = ["top_up", "transfer_in", "escrow_release", "refund"].includes(type);

  switch (type) {
    case "top_up":
      ionicIcon = "card-outline";
      color = COLORS.secondary; // green
      bgColor = "rgba(0, 109, 67, 0.1)";
      break;
    case "transfer_in":
      ionicIcon = "arrow-down-outline";
      color = "#2563eb"; // blue
      bgColor = "rgba(37, 99, 235, 0.1)";
      break;
    case "escrow_release":
      ionicIcon = "lock-open-outline";
      color = "#7c3aed"; // violet
      bgColor = "rgba(124, 58, 237, 0.1)";
      break;
    case "refund":
      ionicIcon = "refresh-outline";
      color = "#ea580c"; // orange
      bgColor = "rgba(234, 88, 12, 0.1)";
      break;
    case "disbursement":
      ionicIcon = "arrow-down-outline";
      color = COLORS.error; // red
      bgColor = "rgba(186, 26, 26, 0.1)";
      break;
    case "transfer_out":
      ionicIcon = "arrow-up-outline";
      color = "#2563eb"; // blue
      bgColor = "rgba(37, 99, 235, 0.1)";
      break;
    case "escrow_deposit":
    case "escrow_lock": // handle legacy key if any
      ionicIcon = "lock-closed-outline";
      color = "#7c3aed"; // violet
      bgColor = "rgba(124, 58, 237, 0.1)";
      break;
    case "contribution":
      ionicIcon = "people-outline";
      color = "#d97706"; // amber
      bgColor = "rgba(217, 119, 6, 0.1)";
      break;
  }

  return {
    title: info.title,
    icon: info.icon,
    bgColor,
    iconColor: info.iconColor,
    description: info.description,
    ionicIcon,
    color,
    isCredit,
  };
};

export const getTransactionSubtitle = (item: { type: string; subtitle?: string; metadata?: any; operator?: string }) => {
  switch (item.type) {
    case "transfer_out":
      return item.metadata?.recipientName ? `To: ${item.metadata.recipientName}` : (item.subtitle || "To user");
    case "transfer_in":
      return item.metadata?.senderName ? `From: ${item.metadata.senderName}` : (item.subtitle || "From user");
    case "top_up":
      return `${item.operator || item.metadata?.operator || "MTN"} Mobile Money`;
    case "disbursement":
      return `To ${item.operator || item.metadata?.operator || "MTN"} Mobile Money`;
    case "escrow_deposit":
    case "escrow_release":
    case "refund":
      return item.metadata?.title || item.metadata?.description || item.subtitle || `Order #${item.metadata?.escrow?.substring(0, 8).toUpperCase() || "CONTRACT"}`;
    case "contribution":
      return item.metadata?.circleName || item.subtitle || "Savings Circle";
    default:
      return item.subtitle || "MboaPay Transaction";
  }
};

