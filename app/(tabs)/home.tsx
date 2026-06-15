import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp, Transaction, Circle } from "../../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../../constants/Theme";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import Card from "../../components/Card";

export default function Home() {
  const router = useRouter();
  const { walletBalance, transactions, circles } = useApp();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "topup":
        router.push("/topup");
        break;
      case "send":
        router.push("/wallet");
        break;
      case "circles":
        router.push("/(tabs)/circles");
        break;
      case "escrow":
        router.push("/(tabs)/escrow");
        break;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return { name: "arrow-down-outline" as const, color: COLORS.secondary };
      case "withdrawal":
        return { name: "arrow-up-outline" as const, color: COLORS.onSurfaceVariant };
      case "send":
        return { name: "arrow-forward-outline" as const, color: COLORS.onSurfaceVariant };
      case "receive":
        return { name: "arrow-back-outline" as const, color: COLORS.secondary };
      case "escrow_lock":
        return { name: "lock-closed-outline" as const, color: COLORS.primary };
      case "escrow_release":
        return { name: "lock-open-outline" as const, color: COLORS.secondary };
      case "tontine_payout":
        return { name: "gift-outline" as const, color: COLORS.secondary };
      case "tontine_pay":
        return { name: "cash-outline" as const, color: COLORS.primary };
      default:
        return { name: "swap-horizontal-outline" as const, color: COLORS.onSurfaceVariant };
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const isPositive = ["deposit", "receive", "tontine_payout", "escrow_release"].includes(item.type) && item.type !== "escrow_release"; // Lock was negative, release is positive
    
    return (
      <View style={styles.txRow}>
        <View style={[styles.txIconContainer, { backgroundColor: icon.color + "15" }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
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
    );
  };

  const renderCircleCard = (circle: Circle) => {
    const isPending = circle.members.find(m => m.name === "You" || m.name === "You (Pending)")?.paid === false;

    return (
      <TouchableOpacity
        key={circle.id}
        activeOpacity={0.9}
        onPress={() => router.push(`/circle-detail/${circle.id}`)}
      >
        <Card style={styles.circleCard} variant="outlined">
          <View style={styles.circleHeader}>
            <View style={styles.circleBadge}>
              <Text style={styles.circleBadgeText}>{circle.type}</Text>
            </View>
            {isPending && (
              <View style={styles.circlePendingBadge}>
                <Text style={styles.circlePendingText}>Due</Text>
              </View>
            )}
          </View>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.circleDetails}>
            Contrib: <Text style={styles.boldText}>{circle.contributionAmount.toLocaleString()} XAF</Text>
          </Text>
          <View style={styles.circleFooter}>
            <Text style={styles.circlePayout}>{circle.nextPayoutDate}</Text>
            <View style={styles.membersCount}>
              <Ionicons name="people-outline" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.membersCountText}>
                {circle.membersCount}/{circle.maxMembers}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent />

      {/* Main Balance Card */}
      <Card variant="secondary" style={styles.balanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>WALLET BALANCE</Text>
          <Ionicons name="shield-checkmark" size={20} color="#ffffff" style={{ opacity: 0.8 }} />
        </View>
        <Text style={styles.balanceText}>{walletBalance.toLocaleString()} XAF</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardSecure}>Protected Account</Text>
          <Text style={styles.cardCurrency}>FCFA (XAF)</Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction("send")}>
          <View style={styles.actionIconOuter}>
            <Ionicons name="send" size={20} color={COLORS.primaryContainer} />
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction("topup")}>
          <View style={styles.actionIconOuter}>
            <Ionicons name="add" size={22} color={COLORS.primaryContainer} />
          </View>
          <Text style={styles.actionText}>Top-up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction("circles")}>
          <View style={styles.actionIconOuter}>
            <Ionicons name="people" size={20} color={COLORS.primaryContainer} />
          </View>
          <Text style={styles.actionText}>Circles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction("escrow")}>
          <View style={styles.actionIconOuter}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryContainer} />
          </View>
          <Text style={styles.actionText}>Escrow</Text>
        </TouchableOpacity>
      </View>

      {/* Savings Circles Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Savings Circles (Tontines)</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/circles")}>
          <Text style={styles.sectionLink}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.circlesScroll}
      >
        {circles.map(renderCircleCard)}
      </ScrollView>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      
      <Card style={styles.txCard} noPadding>
        {transactions.length > 0 ? (
          transactions.map((item, idx) => (
            <View key={item.id}>
              {renderTransactionItem({ item })}
              {idx < transactions.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
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
  balanceCard: {
    marginTop: 12,
    marginBottom: 20,
    height: 150,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balanceText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardSecure: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  cardCurrency: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionIconOuter: {
    width: 54,
    height: 54,
    borderRadius: ROUNDED.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.03)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.headlineMd.fontSize - 2,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryContainer,
  },
  circlesScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  circleCard: {
    width: 200,
    height: 140,
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
  },
  circleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBadge: {
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  circleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  circlePendingBadge: {
    backgroundColor: COLORS.error + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  circlePendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.error,
  },
  circleName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  circleDetails: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  boldText: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  circleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circlePayout: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  membersCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  membersCountText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  txCard: {
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
    width: 40,
    height: 40,
    borderRadius: ROUNDED.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: 14,
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
    fontSize: 14,
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
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
});
