import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import type { Transaction, Circle } from "../../context/types";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../../constants/Theme";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import Card from "../../components/Card";

export default function Home() {
  const router = useRouter();
  const { user, walletBalance, transactions, circles } = useApp();

  const getTransactionDetails = (type: string) => {
    switch (type) {
      case "top_up":
      case "refund":
      case "escrow_release":
      case "disbursement":
        return {
          icon: "arrow-up-outline" as const,
          color: COLORS.secondary,
          bgColor: "rgba(0, 109, 67, 0.08)",
          sign: "+",
          typeLabel: type === "top_up" ? "Top up" : type === "disbursement" ? "Payout" : type === "refund" ? "Refund" : "Release",
        };
      case "contribution":
      case "escrow_lock":
      default:
        return {
          icon: "arrow-up-outline" as const,
          color: COLORS.outline,
          bgColor: "#f0f2f5",
          sign: "-",
          typeLabel: type === "contribution" ? "Contribution" : type === "escrow_lock" ? "Escrow lock" : "Transfer",
        };
    }
  };

  const getCircleIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("trip") || lowerName.includes("travel") || lowerName.includes("vacation") || lowerName.includes("family")) {
      return "airplane-outline" as const;
    }
    if (lowerName.includes("market") || lowerName.includes("trader") || lowerName.includes("business") || lowerName.includes("group")) {
      return "briefcase-outline" as const;
    }
    return "cash-outline" as const;
  };

  const renderCircleCard = (circle: Circle) => {
    // Calculate progress based on paid members
    const paidCount = circle.members.filter((m) => m.paid).length;
    const currentRoundSaved = paidCount * circle.contributionAmount;
    
    // Progress relative to goal
    const progress = circle.goalAmount > 0 ? currentRoundSaved / circle.goalAmount : 0.4;
    const progressPercent = Math.min(Math.max(progress * 100, 8), 100);

    return (
      <TouchableOpacity
        key={circle.id}
        activeOpacity={0.9}
        onPress={() => router.push(`/circle-detail/${circle.id}`)}
        style={styles.circleCardWrapper}
      >
        <Card style={styles.circleCard} variant="outlined" noPadding>
          <View style={styles.circleCardContent}>
            {/* Header info inside circle card */}
            <View style={styles.circleCardHeader}>
              <View style={styles.circleIconContainer}>
                <Ionicons name={getCircleIcon(circle.name)} size={18} color={COLORS.primary} />
                <Text style={styles.circleCardName} numberOfLines={1}>
                  {circle.name}
                </Text>
              </View>
              <Text style={styles.circleCardMembers}>
                {circle.membersCount}/{circle.maxMembers} members
              </Text>
            </View>

            {/* Middle Section: Progress and Balances */}
            <View style={styles.circleCardProgressSection}>
              <View style={styles.circleCardBalances}>
                <Text style={styles.circleCardCurrentBalance}>
                  {currentRoundSaved.toLocaleString()} XAF
                </Text>
                <Text style={styles.circleCardGoalBalance}>
                  Goal: {(circle.goalAmount / 1000).toFixed(0)}k
                </Text>
              </View>

              {/* Custom Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.circleCardFooter}>
              <Text style={styles.circleCardPrepayLabel}>Next payout</Text>
              <Text style={styles.circleCardPrepayDate}>
                {circle.nextPayoutDate.replace("In ", "").split(" (")[0]}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderTransactionRow = (item: Transaction, isLast: boolean) => {
    const details = getTransactionDetails(item.type);
    
    return (
      <View style={styles.txRowWrapper}>
        <View style={styles.txRow}>
          {/* Icon Container */}
          <View style={[styles.txIconContainer, { backgroundColor: details.bgColor }]}>
            <Ionicons name={details.icon} size={18} color={details.color} />
          </View>

          {/* Title and Date Info */}
          <View style={styles.txInfo}>
            <Text style={styles.txTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.txSubtitle}>
              {item.date}
            </Text>
          </View>

          {/* Amount and Subtitle */}
          <View style={styles.txAmountContainer}>
            <Text
              style={[
                styles.txAmount,
                { color: details.sign === "+" ? COLORS.secondary : COLORS.primary },
              ]}
            >
              {details.sign}{item.amount.toLocaleString()} XAF
            </Text>
            <Text style={styles.txTypeLabel}>
              {details.typeLabel}
            </Text>
          </View>
        </View>
        {!isLast && <View style={styles.rowDivider} />}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent />

      {/* Greeting Banner */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greetingText}>Hello, {user.name ? user.name.split(" ")[0] : "John"}</Text>
        <Text style={styles.subtitleText}>Here is your financial summary today.</Text>
      </View>

      {/* Main Balance Card (Primary color variant, styled in Dark Blue) */}
      <Card variant="primary" style={styles.balanceCard}>
        {/* Card Header with Active Pill and Wallet Icon */}
        <View style={styles.cardHeader}>
          <View style={styles.activeBadgeContainer}>
            <Ionicons name="refresh" size={12} color={COLORS.tertiaryContainer} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
          <Ionicons name="wallet-outline" size={20} color="#ffffff" style={{ opacity: 0.8 }} />
        </View>

        {/* Card Balance Information */}
        <View style={styles.balanceInfoContainer}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceText}>{walletBalance.toLocaleString()} XAF</Text>
        </View>

        {/* Card Buttons: Top-up & Send */}
        <View style={styles.cardButtonsRow}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.cardButtonWhite} 
            onPress={() => router.push("/topup")}
          >
            <Ionicons name="add" size={18} color={COLORS.primaryContainer} />
            <Text style={styles.cardButtonWhiteText}>Top up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.cardButtonOutline} 
            onPress={() => router.push("/send")}
          >
            <Ionicons name="paper-plane" size={14} color="#ffffff" style={styles.sendIconRotated} />
            <Text style={styles.cardButtonOutlineText}>Send</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Quick Actions Row */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.actionButtonCard} 
          onPress={() => router.push("/create-circle")}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: "#eef3ff" }]}>
            <Ionicons name="people" size={20} color={COLORS.primaryContainer} />
          </View>
          <Text style={styles.actionButtonText}>New circle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.actionButtonCard} 
          onPress={() => router.push("/join-circle")}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: "#f0f2f5" }]}>
            <Ionicons name="person-add" size={20} color={COLORS.onSurfaceVariant} />
          </View>
          <Text style={styles.actionButtonText}>Join circle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.actionButtonCard} 
          onPress={() => router.push("/create-escrow")}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: "#fdf8e6" }]}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.tertiaryContainer} />
          </View>
          <Text style={styles.actionButtonText}>New escrow</Text>
        </TouchableOpacity>
      </View>

      {/* Savings Circles Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My circles</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/circles")}>
          <Text style={styles.sectionLink}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.circlesScroll}
      >
        {circles.map(renderCircleCard)}
      </ScrollView>

      {/* Recent Transactions Section */}
      <Text style={styles.sectionTitle}>Recent transactions</Text>
      
      <Card style={styles.txCard} noPadding variant="outlined">
        {transactions.length > 0 ? (
          <View style={styles.txList}>
            {transactions.slice(0, 3).map((item, idx) => (
              <View key={item.id}>
                {renderTransactionRow(item, idx === Math.min(transactions.length, 3) - 1)}
              </View>
            ))}
            
            {/* View Entire History Button */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.viewHistoryButton} 
              onPress={() => router.push("/(tabs)/wallet")}
            >
              <Text style={styles.viewHistoryText}>View entire history</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 110, // Generous padding to clear the custom elevated tab bar
  },
  welcomeSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    fontWeight: "500",
  },
  balanceCard: {
    marginTop: 4,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    justifyContent: "space-between",
    minHeight: 185,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 204, 0, 0.18)", // Semi-transparent Gold
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ROUNDED.full,
    gap: 4,
  },
  activeBadgeText: {
    color: COLORS.tertiaryContainer,
    fontSize: 11,
    fontWeight: "700",
  },
  balanceInfoContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  balanceText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 4,
  },
  cardButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cardButtonWhite: {
    flex: 1,
    height: 42,
    backgroundColor: "#ffffff",
    borderRadius: ROUNDED.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardButtonWhiteText: {
    color: COLORS.primaryContainer,
    fontSize: 13,
    fontWeight: "700",
  },
  cardButtonOutline: {
    flex: 1,
    height: 42,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: ROUNDED.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardButtonOutlineText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  sendIconRotated: {
    transform: [{ rotate: "45deg" }],
    marginRight: 2,
    marginTop: -2,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButtonCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.2,
    borderColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryContainer,
    marginBottom: 10,
  },
  circlesScroll: {
    gap: 12,
    paddingBottom: 24,
  },
  circleCardWrapper: {
    width: 215,
  },
  circleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.lg,
  },
  circleCardContent: {
    padding: 16,
    justifyContent: "space-between",
    height: 135,
  },
  circleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  circleCardName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    flex: 1,
  },
  circleCardMembers: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  circleCardProgressSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  circleCardBalances: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  circleCardCurrentBalance: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  circleCardGoalBalance: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.secondary, // Green colored balance fill
    borderRadius: 2,
  },
  circleCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleCardPrepayLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
  },
  circleCardPrepayDate: {
    fontSize: 10,
    color: COLORS.tertiaryContainer,
    fontWeight: "700",
  },
  txCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    borderRadius: ROUNDED.lg,
  },
  txList: {
    width: "100%",
  },
  txRowWrapper: {
    width: "100%",
  },
  txRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  txIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    gap: 2,
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
  txTypeLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  rowDivider: {
    height: 1.2,
    backgroundColor: COLORS.surfaceContainer,
    marginHorizontal: 16,
  },
  viewHistoryButton: {
    height: 44,
    borderRadius: ROUNDED.md,
    borderWidth: 1.2,
    borderColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
  },
  viewHistoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryContainer,
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
