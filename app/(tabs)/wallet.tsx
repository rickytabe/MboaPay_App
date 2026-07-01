import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { LIGHT_COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Transaction } from "../../context/types";

import { getTransactionStyle, getTransactionSubtitle } from "../../constants/TransactionVocabulary";

export default function Wallet() {
  const router = useRouter();
  const { walletBalance, transactions, selectedOperator, setOperator, colors, theme, devFundWallet } = useApp();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "send">("all");
  const [showUSD, setShowUSD] = useState(false);
  const exchangeRate = 600;

  const isInflowType = (type: string) => ["top_up", "refund", "escrow_release", "transfer_in"].includes(type);
  const isOutflowType = (type: string) => ["disbursement", "contribution", "escrow_deposit", "escrow_lock", "transfer_out"].includes(type);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "deposit") return isInflowType(tx.type);
    if (activeTab === "send") return isOutflowType(tx.type);
    return true;
  });

  const getGroupLabel = (item: Transaction) => {
    const rawDate = item.created_at || item.metadata?.created_at;
    const txDate = rawDate ? new Date(rawDate) : new Date(item.date);
    
    if (isNaN(txDate.getTime())) {
      return "Earlier";
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (txDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return txDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    }
  };

  const sortedFilteredTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
  );

  const groupedTransactions: { [key: string]: Transaction[] } = {};
  const groupOrder: string[] = [];

  sortedFilteredTransactions.forEach((tx) => {
    const label = getGroupLabel(tx);
    if (!groupedTransactions[label]) {
      groupedTransactions[label] = [];
      groupOrder.push(label);
    }
    groupedTransactions[label].push(tx);
  });

  const renderTransactionRow = (item: Transaction, isLast: boolean) => {
    const styleInfo = getTransactionStyle(item.type);
    const sub = getTransactionSubtitle(item);
    const isPositive = styleInfo.isCredit;
    
    return (
      <View key={item.id}>
        <TouchableOpacity style={styles.txRow} onPress={() => router.push(`/transaction-detail/${item.id}` as any)}>
          <View style={[styles.txIconContainer, { backgroundColor: styleInfo.bgColor }]}>
            <Ionicons name={styleInfo.ionicIcon} size={18} color={styleInfo.color} />
          </View>
          
          {/* Left / Middle Text block: [Title], [Context/Counterparty], [Time] */}
          <View style={styles.txInfo}>
            <Text style={styles.txTitle}>{styleInfo.title}</Text>
            <Text style={styles.txSubtitle} numberOfLines={1}>{sub}</Text>
            <Text style={styles.txTime}>{item.date}</Text>
          </View>

          {/* Right Amount */}
          <View style={styles.txAmountContainer}>
            <Text
              style={[
                styles.txAmount,
                { color: isPositive ? colors.secondary : colors.error },
              ]}
            >
              {isPositive ? "+" : "-"} {item.amount.toLocaleString()} XAF
            </Text>
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
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
            ? { borderLeftWidth: 6, borderLeftColor: colors.mtn }
            : { borderLeftWidth: 6, borderLeftColor: colors.orange },
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
            color={selectedOperator === "MTN" ? colors.mtn : colors.orange}
          />
        </View>
        
        <View style={styles.balanceContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity onPress={() => setShowUSD(!showUSD)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 }}>
              <Ionicons name="swap-vertical" size={14} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{showUSD ? 'XAF' : 'USD'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceText}>
            {showUSD 
              ? `$${(walletBalance / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `${walletBalance.toLocaleString()} XAF`}
          </Text>
          <TouchableOpacity onPress={() => devFundWallet(1000000000)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 13, color: colors.secondary, fontWeight: '700' }}>+ Fund 1B XAF (Dev)</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={
            selectedOperator === "MTN"
              ? require("../../assets/mtn_momo.png")
              : require("../../assets/orange_momo.png")
          }
          style={styles.operatorLogoLarge}
          resizeMode="contain"
        />
      </Card>

      {/* Wallet Actions */}
      <View style={styles.actionButtonsRow}>
        <Button
          title="Top-up"
          onPress={() => router.push("/topup")}
          type="primary"
          style={{ flex: 1 }}
        />
        <Button
          title="Withdraw"
          onPress={() => router.push("/withdraw")}
          type="outlined"
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
          groupOrder.map((groupLabel) => (
            <View key={groupLabel} style={styles.groupContainer}>
              <View style={styles.groupHeaderContainer}>
                <Text style={styles.groupHeaderText}>{groupLabel}</Text>
              </View>
              {groupedTransactions[groupLabel].map((item, idx) => 
                renderTransactionRow(item, idx === groupedTransactions[groupLabel].length - 1)
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={40} color={colors.outline} />
            <Text style={styles.emptyHistoryText}>
              {transactions.length === 0 
                ? "No transactions yet.\nYour transaction history will appear here once you start using MboaPay."
                : "No transactions found for this filter"}
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    paddingBottom: 120,
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
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  changeLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  mnoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  walletCard: {
    backgroundColor: colors.surface,
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
    color: colors.primary,
  },
  walletNumber: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  balanceContainer: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
  },
  operatorBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  operatorLogo: {
    width: 34,
    height: 34,
  },
  operatorLogoLarge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 72,
    height: 72,
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
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainer,
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
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primaryContainer,
  },
  historyCard: {
    backgroundColor: colors.surface,
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
    color: colors.primary,
  },
  txSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  txTime: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
    marginTop: 2,
  },
  groupContainer: {
    marginBottom: 8,
  },
  groupHeaderContainer: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryContainer,
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
    color: colors.secondary,
  },
  txNegative: {
    color: colors.primary,
  },
  txDate: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: SPACING.md,
  },
  emptyHistory: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyHistoryText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: "center",
  },
});
