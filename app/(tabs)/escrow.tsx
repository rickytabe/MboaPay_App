import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import type { Escrow } from "../../context/types";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../../constants/Theme";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function EscrowHome() {
  const router = useRouter();
  const { escrows } = useApp();

  const buyerLocked = escrows
    .filter((e) => e.role === "buyer" && e.status === "locked")
    .reduce((sum, e) => sum + e.amount, 0);

  const sellerLocked = escrows
    .filter((e) => e.role === "seller" && (e.status === "locked" || e.status === "pending_payment"))
    .reduce((sum, e) => sum + e.amount, 0);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "locked":
        return { container: styles.lockedBadge, text: styles.lockedText, label: "Secured" };
      case "pending_payment":
        return { container: styles.pendingBadge, text: styles.pendingText, label: "Awaiting Pay" };
      case "disputed":
        return { container: styles.disputedBadge, text: styles.disputedText, label: "Disputed" };
      case "released":
        return { container: styles.releasedBadge, text: styles.releasedText, label: "Released" };
      default:
        return { container: styles.lockedBadge, text: styles.lockedText, label: "Secured" };
    }
  };

  const renderEscrowRow = (item: Escrow) => {
    const badge = getStatusBadgeStyle(item.status);
    
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
              <Ionicons name="chevron-forward" size={16} color={COLORS.outline} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent title="Escrow Protection" />

      {/* Overview Stats Cards */}
      <View style={styles.statsContainer}>
        <Card variant="flat" style={styles.statCard}>
          <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
          <Text style={styles.statLabel}>Locked as Buyer</Text>
          <Text style={styles.statAmount}>{buyerLocked.toLocaleString()} XAF</Text>
        </Card>

        <Card variant="flat" style={styles.statCard}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.secondary} />
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
        {escrows.length > 0 ? (
          escrows.map(renderEscrowRow)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color={COLORS.outline} />
            <Text style={styles.emptyTitle}>No Escrow Protection Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create an escrow contract to guarantee safe delivery of goods and services.
            </Text>
          </View>
        )}
      </View>
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
    backgroundColor: COLORS.surface,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  actionBtn: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  listSection: {
    gap: 16,
  },
  escrowCard: {
    backgroundColor: COLORS.surface,
    gap: 12,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: ROUNDED.sm,
  },
  buyerRole: {
    backgroundColor: COLORS.primary + "12",
  },
  sellerRole: {
    backgroundColor: COLORS.secondary + "12",
  },
  buyerRoleText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.primary,
  },
  sellerRoleText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  escrowCode: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  escrowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  lockedBadge: {
    backgroundColor: COLORS.primaryContainer + "10",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primaryContainer,
  },
  pendingBadge: {
    backgroundColor: COLORS.tertiary + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.tertiary,
  },
  disputedBadge: {
    backgroundColor: COLORS.error + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  disputedText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.error,
  },
  releasedBadge: {
    backgroundColor: COLORS.secondary + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  releasedText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  escrowDesc: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    paddingTop: 12,
  },
  footerLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  footerValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerDate: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
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
    color: COLORS.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
});
