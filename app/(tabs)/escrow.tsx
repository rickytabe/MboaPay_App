import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import Card from "../../components/Card";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { LIGHT_COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Escrow } from "../../context/types";

export default function EscrowHome() {
  const router = useRouter();
  const { escrows, colors } = useApp();
  const styles = getStyles(colors);

  const buyerLocked = escrows
    .filter((e) => e.role === "buyer" && e.status === "locked" && e.pawapayDepositId)
    .reduce((sum, e) => sum + e.amount, 0);

  const sellerLocked = escrows
    .filter((e) => e.role === "seller" && e.status === "locked" && e.pawapayDepositId)
    .reduce((sum, e) => sum + e.amount, 0);

  const getStatusBadgeStyle = (item: Escrow) => {
    if (item.status === "locked" && !item.pawapayDepositId) {
      return { container: styles.pendingBadge, text: styles.pendingText, label: "Awaiting Pay" };
    }
    if (item.status === "locked" && item.recipientConfirm === "confirmed") {
      return { container: styles.pendingBadge, text: styles.pendingText, label: "Release Req" };
    }

    switch (item.status) {
      case "locked":
        return { container: styles.lockedBadge, text: styles.lockedText, label: "Secured" };
      case "disputed":
        return { container: styles.disputedBadge, text: styles.disputedText, label: "Disputed" };
      case "released":
        return { container: styles.releasedBadge, text: styles.releasedText, label: "Released" };
      case "refunded":
        return { container: styles.refundedBadge, text: styles.refundedText, label: "Refunded" };
      default:
        return { container: styles.lockedBadge, text: styles.lockedText, label: "Secured" };
    }
  };

  const renderEscrowRow = (item: Escrow) => {
    const badge = getStatusBadgeStyle(item);
    
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.95}
        onPress={() => router.push(`/escrow-detail/${item.id}`)}
      >
        <Card variant="elevated" style={styles.escrowCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <View style={styles.roleBadgeContainer}>
                <View style={[styles.roleBadge, item.role === "buyer" ? styles.buyerRole : styles.sellerRole]}>
                  <Ionicons name={item.role === "buyer" ? "lock-closed" : "lock-open"} size={10} color={item.role === "buyer" ? colors.primary : colors.secondary} />
                  <Text style={item.role === "buyer" ? styles.buyerRoleText : styles.sellerRoleText}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.escrowCode}>{item.code}</Text>
              </View>
              <Text style={styles.escrowTitle} numberOfLines={1}>{item.title}</Text>
            </View>

            <View style={badge.container}>
              <Text style={badge.text}>{badge.label}</Text>
            </View>
          </View>

          <Text style={styles.escrowDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.footerLabel}>Protected Amount</Text>
              <Text style={styles.footerValue}>{item.amount.toLocaleString()} XAF</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerDate}>{item.date}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const getGroupLabel = (item: Escrow) => {
    const rawDate = item.created_at || item.date;
    const txDate = new Date(rawDate);
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

  const sortedEscrows = [...escrows].sort(
    (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
  );

  const groupedEscrows: { [key: string]: Escrow[] } = {};
  const groupOrder: string[] = [];

  sortedEscrows.forEach((escrow) => {
    const label = getGroupLabel(escrow);
    if (!groupedEscrows[label]) {
      groupedEscrows[label] = [];
      groupOrder.push(label);
    }
    groupedEscrows[label].push(escrow);
  });

  return (
    <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent title="Escrow Protection" tabName="Escrow"/>

      {/* Overview Stats Cards */}
      <View style={styles.statsContainer}>
        <Card variant="flat" style={styles.statCard}>
          <Ionicons name="lock-closed" size={20} color={colors.primary} />
          <Text style={styles.statLabel}>Locked as Buyer</Text>
          <Text style={styles.statAmount}>{buyerLocked.toLocaleString()} XAF</Text>
        </Card>

        <Card variant="flat" style={styles.statCard}>
          <Ionicons name="wallet-outline" size={20} color={colors.secondary} />
          <Text style={styles.statLabel}>Incoming as Seller</Text>
          <Text style={styles.statAmount}>{sellerLocked.toLocaleString()} XAF</Text>
        </Card>
      </View>

      {/* Action CTA */}
      <Button
        title="Create New Escrow Agreement"
        onPress={() => router.push("/create-escrow")}
        type="primary"
        style={styles.actionBtn}
      />

      {/* Escrow Agreements List */}
      <Text style={styles.sectionTitle}>Escrow Agreements</Text>
      
      <View style={styles.listSection}>
        {sortedEscrows.length > 0 ? (
          groupOrder.map((groupLabel) => (
            <View key={groupLabel} style={styles.groupContainer}>
              <View style={styles.groupHeaderContainer}>
                <Text style={styles.groupHeaderText}>{groupLabel}</Text>
              </View>
              <View style={styles.groupCardsContainer}>
                {groupedEscrows[groupLabel].map(renderEscrowRow)}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>No Escrow Protection Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create an escrow contract to guarantee safe delivery of goods and services.
            </Text>
          </View>
        )}
      </View>
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
    paddingBottom: 110,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.surfaceContainer,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  actionBtn: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  listSection: {
    gap: 16,
  },
  escrowCard: {
    backgroundColor: colors.surface,
    gap: 12,
    borderWidth: 1.2,
    borderColor: colors.surfaceContainerHigh || colors.outlineVariant,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  roleBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.sm,
  },
  buyerRole: {
    backgroundColor: colors.primary + "12",
  },
  sellerRole: {
    backgroundColor: colors.secondary + "12",
  },
  buyerRoleText: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.primary,
  },
  sellerRoleText: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.secondary,
  },
  escrowCode: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  escrowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  lockedBadge: {
    backgroundColor: colors.primaryContainer + "10",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryContainer,
  },
  pendingBadge: {
    backgroundColor: colors.tertiary + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.tertiary,
  },
  disputedBadge: {
    backgroundColor: colors.error + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  disputedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.error,
  },
  refundedBadge: {
    backgroundColor: "rgba(234, 88, 12, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  refundedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ea580c",
  },
  releasedBadge: {
    backgroundColor: colors.secondary + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  releasedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.secondary,
  },
  escrowDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 12,
  },
  footerLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  footerValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerDate: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeaderContainer: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceContainer,
    borderRadius: ROUNDED.sm,
    marginBottom: 12,
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryContainer,
  },
  groupCardsContainer: {
    gap: 16,
  },
});

