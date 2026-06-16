import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Transaction } from "../../context/types";

export default function Wallet() {
  const router = useRouter();
  const { walletBalance, transactions, selectedOperator, setOperator } = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "send">("all");

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "deposit") return tx.type === "top_up" || tx.type === "refund" || tx.type === "disbursement" || tx.type === "escrow_release";
    if (activeTab === "send") return tx.type === "contribution" || tx.type === "escrow_lock";
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "top_up":
        return { name: "arrow-up-outline" as const, color: COLORS.secondary };
      case "contribution":
        return { name: "arrow-up-outline" as const, color: COLORS.onSurfaceVariant };
      case "disbursement":
        return { name: "arrow-down-outline" as const, color: COLORS.secondary };
      case "refund":
        return { name: "arrow-back-outline" as const, color: COLORS.secondary };
      case "escrow_lock":
        return { name: "lock-closed-outline" as const, color: COLORS.primary };
      case "escrow_release":
        return { name: "lock-open-outline" as const, color: COLORS.secondary };
      default:
        return { name: "swap-horizontal-outline" as const, color: COLORS.onSurfaceVariant };
    }
  };

  const renderTransactionRow = (item: Transaction, idx: number) => {
    const icon = getTransactionIcon(item.type);
    const isPositive = ["top_up", "refund", "disbursement", "escrow_release"].includes(item.type);
    
    return (
      <View key={item.id}>
        <View style={styles.txRow}>
          <View style={[styles.txIconContainer, { backgroundColor: icon.color + "15" }]}>
            <Ionicons name={icon.name} size={18} color={icon.color} />
          </View>
          <View style={styles.txInfo}>
            <Text style={styles.txTitle}>{item.title}</Text>
            <Text style={styles.txSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.txAmountContainer}>
            <Text
              style={[
                styles.txAmount,
                isPositive ? styles.txPositive : styles.txNegative,
              ]}
            >
              {isPositive ? "+" : "-"} {item.amount.toLocaleString()} XAF
            </Text>
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
        </View>
        {idx < filteredTransactions.length - 1 && <View style={styles.divider} />}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent title="Wallet Dashboard" />

      {/* Operator Settings (auto-detected) */}
      <View style={styles.mnoSection}>
        <Text style={styles.mnoLabel}>Active Mobile Wallet</Text>
        <View style={styles.mnoRow}>
          <Text style={styles.detectedText}>{selectedOperator === 'MTN' ? 'MTN Mobile Money' : 'Orange Money'}</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Account Card */}
      <Card
        variant="elevated"
        style={[
          styles.walletCard,
          selectedOperator === "MTN"
            ? { borderLeftWidth: 6, borderLeftColor: COLORS.mtn }
            : { borderLeftWidth: 6, borderLeftColor: COLORS.orange },
        ] as any}
      >
        <View style={styles.walletDetails}>
          <View>
            <Text style={styles.walletName}>{selectedOperator === "MTN" ? "MTN Mobile Money" : "Orange Money"}</Text>
            <Text style={styles.walletNumber}>Connected Wallet Account</Text>
          </View>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={selectedOperator === "MTN" ? COLORS.mtn : COLORS.orange}
          />
        </View>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceText}>{walletBalance.toLocaleString()} XAF</Text>
        </View>
      </Card>

      {/* Wallet Actions */}
      <View style={styles.actionButtonsRow}>
        <Button
          title="Top-up Wallet"
          onPress={() => router.push("/topup")}
          type="primary"
          style={{ flex: 1 }}
        />
      </View>

      {/* Transactions Section */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Transaction History</Text>
      </View>

      {/* Transaction Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "all" && styles.tabButtonActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "deposit" && styles.tabButtonActive]}
          onPress={() => setActiveTab("deposit")}
        >
          <Text style={[styles.tabText, activeTab === "deposit" && styles.tabTextActive]}>Inflows</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "send" && styles.tabButtonActive]}
          onPress={() => setActiveTab("send")}
        >
          <Text style={[styles.tabText, activeTab === "send" && styles.tabTextActive]}>Outflows</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List Card */}
      <Card style={styles.historyCard} noPadding>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(renderTransactionRow)
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.outline} />
            <Text style={styles.emptyHistoryText}>No transactions found for this filter</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    paddingBottom: 30,
  },
  mnoSection: {
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
  },
  mnoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detectedText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  changeLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  mnoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  walletCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    marginBottom: 20,
  },
  walletDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  walletName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  walletNumber: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  balanceContainer: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.md,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: ROUNDED.default,
  },
  tabButtonActive: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  tabTextActive: {
    color: COLORS.primaryContainer,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },
  txRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: ROUNDED.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    gap: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  txSubtitle: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  txAmountContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  txPositive: {
    color: COLORS.secondary,
  },
  txNegative: {
    color: COLORS.primary,
  },
  txDate: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginHorizontal: SPACING.md,
  },
  emptyHistory: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyHistoryText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    textAlign: "center",
  },
});
