import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import CircleCardComponent from "../../components/CircleCardComponent";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { LIGHT_COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Circle, Transaction } from "../../context/types";

import { getTransactionStyle, getTransactionSubtitle } from "../../constants/TransactionVocabulary";

export default function Home() {
  const router = useRouter();
  const { user, walletBalance, transactions, circles, colors, theme } = useApp();
  const styles = getStyles(colors);
  const [showUSD, setShowUSD] = useState(false);
  const exchangeRate = 600;

  const renderCircleCard = (circle: Circle) => {
    return <CircleCardComponent key={circle.id} circle={circle} colors={colors} />;
  };

  const renderTransactionRow = (item: Transaction, isLast: boolean) => {
    const styleInfo = getTransactionStyle(item.type);
    const sub = getTransactionSubtitle(item);
    const isPositive = styleInfo.isCredit;
    
    return (
      <View style={styles.txRowWrapper}>
        <TouchableOpacity 
          style={styles.txRow} 
          onPress={() => router.push(`/transaction-detail/${item.id}` as any)}
        >
          {/* Icon Container */}
          <View style={[styles.txIconContainer, { backgroundColor: styleInfo.bgColor }]}>
            <Ionicons name={styleInfo.ionicIcon} size={18} color={styleInfo.color} />
          </View>

          {/* Left / Middle Text block: [Title], [Context/Counterparty], [Time] */}
          <View style={styles.txInfo}>
            <Text style={styles.txTitle} numberOfLines={1}>
              {styleInfo.title}
            </Text>
            <Text style={styles.txSubtitle} numberOfLines={1}>
              {sub}
            </Text>
            <Text style={styles.txTime}>
              {item.date}
            </Text>
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
        {!isLast && <View style={styles.rowDivider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent tabName="Home"/>

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
            <Ionicons name="refresh" size={12} color={colors.tertiaryContainer} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
          <Ionicons name="wallet-outline" size={20} color="#ffffff" style={{ opacity: 0.8 }} />
        </View>

        {/* Card Balance Information */}
        <View style={styles.balanceInfoContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity onPress={() => setShowUSD(!showUSD)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 }}>
              <Ionicons name="swap-vertical" size={14} color="#ffffff" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: "#ffffff" }}>{showUSD ? 'XAF' : 'USD'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceText} adjustsFontSizeToFit numberOfLines={1}>
            {showUSD 
              ? `$${(walletBalance / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `${walletBalance.toLocaleString()} XAF`}
          </Text>
        </View>

        {/* Card Buttons: Top-up, Send & Withdraw */}
        <View style={styles.cardButtonsRow}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.cardButtonWhite} 
            onPress={() => router.push("/topup")}
          >
            <Ionicons name="add" size={16} color={colors.primaryContainer} />
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

          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.cardButtonOutline} 
            onPress={() => router.push("/withdraw")}
          >
            <Ionicons name="arrow-down" size={14} color="#ffffff" />
            <Text style={styles.cardButtonOutlineText}>Withdraw</Text>
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
          <View style={[styles.actionIconCircle, { backgroundColor: theme === "dark" ? colors.surfaceContainer : "#eef3ff" }]}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <Text style={styles.actionButtonText}>New circle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.actionButtonCard} 
          onPress={() => router.push("/join-circle")}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: theme === "dark" ? colors.surfaceContainer : "#f0f2f5" }]}>
            <Ionicons name="person-add" size={20} color={colors.onSurfaceVariant} />
          </View>
          <Text style={styles.actionButtonText}>Join circle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          style={styles.actionButtonCard} 
          onPress={() => router.push("/create-escrow")}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: theme === "dark" ? colors.surfaceContainer : "#fdf8e6" }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.tertiary} />
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
        {[...circles]
          .filter(c => c.isMember)
          .sort((a, b) => {
            const timeA = Math.max(new Date(a.joinedAt || a.createdAt || 0).getTime(), new Date(a.updatedAt || 0).getTime());
            const timeB = Math.max(new Date(b.joinedAt || b.createdAt || 0).getTime(), new Date(b.updatedAt || 0).getTime());
            return timeB - timeA;
          })
          .map(renderCircleCard)}
      </ScrollView>

      {/* Recent Transactions Section */}
      <Text style={styles.sectionTitle}>Recent transactions</Text>
      
      <Card style={styles.txCard} noPadding variant="outlined">
        {transactions.length > 0 ? (
          <View style={styles.txList}>
            {[...transactions]
              .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
              .slice(0, 3)
              .map((item, idx, arr) => (
                <View key={item.id}>
                  {renderTransactionRow(item, idx === arr.length - 1)}
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
            <Text style={styles.emptyText}>
              No transactions yet.{"\n"}Your transaction history will appear here once you start using MboaPay.
            </Text>
          </View>
        )}
      </Card>
      </ScrollView></SafeAreaView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 110, // Generous padding to clear the custom elevated tab bar
  },
  welcomeSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
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
    color: colors.tertiaryContainer,
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
    color: colors.primaryContainer,
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
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.surfaceContainer,
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
    color: colors.primary,
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
    color: colors.primary,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryContainer,
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
    backgroundColor: colors.surface,
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
    color: colors.primary,
    flex: 1,
  },
  circleCardMembers: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
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
    color: colors.primary,
  },
  circleCardGoalBalance: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.secondary, // Green colored balance fill
    borderRadius: 2,
  },
  circleCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleCardPrepayLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  circleCardPrepayDate: {
    fontSize: 10,
    color: colors.tertiaryContainer,
    fontWeight: "700",
  },
  txCard: {
    backgroundColor: colors.surface,
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
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  rowDivider: {
    height: 1.2,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: 16,
  },
  viewHistoryButton: {
    height: 44,
    borderRadius: ROUNDED.md,
    borderWidth: 1.2,
    borderColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
  },
  viewHistoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryContainer,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
});
