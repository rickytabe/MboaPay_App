import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Circle } from "../../context/types";

export default function Circles() {
  const router = useRouter();
  const { circles } = useApp();
  const [activeTab, setActiveTab] = useState<"joined" | "explore">("joined");

  const handleCreateCircle = () => {
    router.push("/create-circle");
  };

  const handleJoinCircle = () => {
    router.push("/join-circle");
  };

  const renderCircleRow = (circle: Circle) => {
    const isPending = circle.members.find(m => m.name === "You" || m.name === "You (Pending)")?.paid === false;
    
    return (
      <TouchableOpacity
        key={circle.id}
        activeOpacity={0.95}
        onPress={() => router.push(`/circle-detail/${circle.id}`)}
      >
        <Card variant="elevated" style={styles.circleRowCard}>
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.typeBadgeContainer}>
                <Text style={styles.typeBadgeText}>{circle.type.toUpperCase()}</Text>
                {circle.isTreasurer && (
                  <View style={styles.treasurerBadge}>
                    <Text style={styles.treasurerBadgeText}>Treasurer</Text>
                  </View>
                )}
              </View>
              <Text style={styles.circleName}>{circle.name}</Text>
              <Text style={styles.circleCode}>Code: {circle.code}</Text>
            </View>

            {isPending ? (
              <View style={styles.dueBadge}>
                <Text style={styles.dueText}>Due</Text>
              </View>
            ) : (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>Paid</Text>
              </View>
            )}
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statGroup}>
              <Text style={styles.statLabel}>Contribution</Text>
              <Text style={styles.statValue}>{circle.contributionAmount.toLocaleString()} XAF</Text>
            </View>
            <View style={styles.statGroup}>
              <Text style={styles.statLabel}>Frequency</Text>
              <Text style={styles.statValue}>{circle.frequency}</Text>
            </View>
            <View style={styles.statGroup}>
              <Text style={styles.statLabel}>Target Pool</Text>
              <Text style={styles.statValue}>{circle.goalAmount.toLocaleString()} XAF</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.payoutTimeline}>
              <Ionicons name="time-outline" size={13} color={COLORS.secondary} /> {circle.nextPayoutDate}
            </Text>
            <View style={styles.avatarsList}>
              {circle.members.slice(0, 3).map((m, idx) => (
                <Image
                  key={idx}
                  source={{ uri: m.avatar }}
                  style={[styles.memberAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}
                />
              ))}
              {circle.membersCount > 3 && (
                <View style={styles.moreAvatarsBadge}>
                  <Text style={styles.moreAvatarsText}>+{circle.membersCount - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <SafeAreaView>
      <TopNavBarComponent title="Savings Circles" />

      {/* Intro Cards */}
      <View style={styles.actionHeaderCards}>
        <TouchableOpacity style={styles.actionCard} onPress={handleCreateCircle} activeOpacity={0.9}>
          <Card variant="primary" style={styles.innerCard}>
            <Ionicons name="add-circle" size={32} color="#ffffff" />
            <Text style={styles.actionCardTitle}>Create Circle</Text>
            <Text style={styles.actionCardDesc}>Start a new tontine savings group</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleJoinCircle} activeOpacity={0.9}>
          <Card variant="secondary" style={styles.innerCard}>
            <Ionicons name="enter" size={32} color="#ffffff" />
            <Text style={styles.actionCardTitle}>Join Circle</Text>
            <Text style={styles.actionCardDesc}>Enter an invite code to join savings</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "joined" && styles.tabButtonActive]}
          onPress={() => setActiveTab("joined")}
        >
          <Text style={[styles.tabText, activeTab === "joined" && styles.tabTextActive]}>My Circles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "explore" && styles.tabButtonActive]}
          onPress={() => setActiveTab("explore")}
        >
          <Text style={[styles.tabText, activeTab === "explore" && styles.tabTextActive]}>Explore public</Text>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      {activeTab === "joined" ? (
        <View style={styles.listSection}>
          {circles.length > 0 ? (
            circles.map(renderCircleRow)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.outline} />
              <Text style={styles.emptyTitle}>No circles joined</Text>
              <Text style={styles.emptySubtitle}>Create your own savings circle or join one using an invite code.</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.exploreSection}>
          <Card variant="outlined" style={styles.exploreCard}>
            <View style={styles.exploreHeader}>
              <View style={styles.typeBadgeContainer}>
                <Text style={styles.typeBadgeText}>TONTINE</Text>
              </View>
              <Text style={styles.joinText}>Public Pool</Text>
            </View>
            <Text style={styles.exploreName}>Yaounde Market Women Savings</Text>
            <Text style={styles.exploreDesc}>A secure community pool for agricultural wholesale traders.</Text>
            <View style={styles.exploreFooter}>
              <Text style={styles.exploreStats}>25,000 XAF/mo • 14 Members</Text>
              <TouchableOpacity style={styles.exploreJoinButton} onPress={() => router.push("/join-circle")}>
                <Text style={styles.exploreJoinText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card variant="outlined" style={styles.exploreCard}>
            <View style={styles.exploreHeader}>
              <View style={styles.typeBadgeContainer}>
                <Text style={styles.typeBadgeText}>GOAL</Text>
              </View>
              <Text style={styles.joinText}>Public Pool</Text>
            </View>
            <Text style={styles.exploreName}>West Region Investment Group</Text>
            <Text style={styles.exploreDesc}>Savings pool for community building land development targets.</Text>
            <View style={styles.exploreFooter}>
              <Text style={styles.exploreStats}>50,000 XAF/mo • 8 Members</Text>
              <TouchableOpacity style={styles.exploreJoinButton} onPress={() => router.push("/join-circle")}>
                <Text style={styles.exploreJoinText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      )}
      </SafeAreaView>
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
    paddingBottom: 30,
  },
  actionHeaderCards: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
  },
  innerCard: {
    height: 130,
    padding: 14,
    justifyContent: "space-between",
  },
  actionCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  actionCardDesc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.md,
    padding: 3,
    marginBottom: 20,
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
  listSection: {
    gap: 16,
  },
  circleRowCard: {
    backgroundColor: COLORS.surface,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  typeBadgeContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: ROUNDED.sm,
    letterSpacing: 0.5,
  },
  treasurerBadge: {
    backgroundColor: COLORS.primaryContainer + "12",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: ROUNDED.sm,
  },
  treasurerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primaryContainer,
  },
  circleName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 6,
  },
  circleCode: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  dueBadge: {
    backgroundColor: COLORS.error + "15",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: ROUNDED.full,
  },
  dueText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.error,
  },
  paidBadge: {
    backgroundColor: COLORS.secondary + "15",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: ROUNDED.full,
  },
  paidText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: ROUNDED.md,
  },
  statGroup: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payoutTimeline: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "700",
    flexDirection: "row",
    alignItems: "center",
  },
  avatarsList: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  moreAvatarsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  moreAvatarsText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
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
  exploreSection: {
    gap: 16,
  },
  exploreCard: {
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  exploreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  exploreName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  exploreDesc: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  exploreFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  exploreStats: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  exploreJoinButton: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: ROUNDED.default,
  },
  exploreJoinText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
