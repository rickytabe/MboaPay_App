import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import InitialsAvatar from "../../components/InitialsAvatar";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { LIGHT_COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import type { Circle } from "../../context/types";

const CircleSkeleton = ({ colors }: { colors: typeof LIGHT_COLORS }) => {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Card variant="elevated" style={{ backgroundColor: colors.surface, gap: 16, marginBottom: 16 }}>
      <Animated.View style={{ opacity: anim }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <View style={{ width: 60, height: 16, backgroundColor: colors.surfaceContainerHigh || colors.surfaceContainer, borderRadius: 4 }} />
            <View style={{ width: 120, height: 20, backgroundColor: colors.surfaceContainerHigh || colors.surfaceContainer, borderRadius: 4, marginTop: 8 }} />
            <View style={{ width: 80, height: 14, backgroundColor: colors.surfaceContainerHigh || colors.surfaceContainer, borderRadius: 4, marginTop: 4 }} />
          </View>
          <View style={{ width: 40, height: 20, backgroundColor: colors.surfaceContainerHigh || colors.surfaceContainer, borderRadius: 10 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, padding: 12, backgroundColor: colors.surfaceContainer, borderRadius: 8 }}>
          <View style={{ width: 60, height: 24, backgroundColor: colors.surfaceContainerHigh || colors.outlineVariant, borderRadius: 4 }} />
          <View style={{ width: 60, height: 24, backgroundColor: colors.surfaceContainerHigh || colors.outlineVariant, borderRadius: 4 }} />
          <View style={{ width: 60, height: 24, backgroundColor: colors.surfaceContainerHigh || colors.outlineVariant, borderRadius: 4 }} />
        </View>
      </Animated.View>
    </Card>
  );
};

export default function Circles() {
  const router = useRouter();
  const { circles, joinCircleByCode, colors, theme, isDataLoading } = useApp();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<"joined" | "explore">("joined");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const joinedCircles = circles
    .filter((c) => c.isMember)
    .sort((a, b) => {
      const timeA = new Date(a.joinedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.joinedAt || b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  
  const exploreCircles = circles
    .filter((c) => !c.isMember && c.visibility === "public")
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

  const handleCreateCircle = () => {
    router.push("/create-circle");
  };

  const handleJoinCircle = () => {
    router.push("/join-circle");
  };

  const handleDirectJoin = async (circle: Circle) => {
    setJoiningId(circle.id);
    try {
      const result = await joinCircleByCode(circle.code);
      if (result.success) {
        Alert.alert("Success", `Successfully joined public group "${circle.name}"!`);
      } else {
        console.log(result.message);
        Alert.alert("Failed to Join", result.message);

      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to join public group.");
    } finally {
      setJoiningId(null);
    }
  };

  const renderCircleRow = (circle: Circle) => {
    const isPending = circle.members.some(m => (m.name === "You" || m.name === "You (Pending)") && m.isPending);

    return (
      <TouchableOpacity
        key={circle.id}
        activeOpacity={0.95}
        onPress={() => {
          if (circle.isTreasurer) {
            router.push({ pathname: "/admin-circle/[id]", params: { id: circle.id } } as any);
          } else {
            router.push({ pathname: "/circle-detail/[id]", params: { id: circle.id } } as any);
          }
        }}
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
              <Ionicons name="time-outline" size={13} color={colors.secondary} /> {circle.nextPayoutDate}
            </Text>
            {circle.rawType !== 'solo' ? (
              <View style={styles.avatarsList}>
                {circle.members.slice(0, 3).map((m, idx) => (
                  <View key={idx} style={{ marginLeft: idx > 0 ? -10 : 0 }}>
                    {m.avatar ? (
                      <Image
                        source={{ uri: m.avatar }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <InitialsAvatar name={m.name} size={24} />
                    )}
                  </View>
                ))}
                {circle.membersCount > 3 && (
                  <View style={styles.moreAvatarsBadge}>
                    <Text style={styles.moreAvatarsText}>+{circle.membersCount - 3}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flex: 1, marginLeft: 16, height: 6, backgroundColor: colors.surfaceContainer, borderRadius: ROUNDED.full, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, ((circle.totalContributed || 0) / (circle.goalAmount || 1)) * 100)}%`, height: '100%', backgroundColor: colors.secondary }} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.contentContainer}>
        <TopNavBarComponent title="Savings Circles" tabName="Circles" />

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
        {isDataLoading && circles.length === 0 ? (
          <View style={styles.listSection}>
            <CircleSkeleton colors={colors} />
            <CircleSkeleton colors={colors} />
            <CircleSkeleton colors={colors} />
          </View>
        ) : activeTab === "joined" ? (
          <View style={styles.listSection}>
            {joinedCircles.length > 0 ? (
              joinedCircles.map(renderCircleRow)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.outline} />
                <Text style={styles.emptyTitle}>No circles joined</Text>
                <Text style={styles.emptySubtitle}>Create your own savings circle or join one using an invite code.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.exploreSection}>
            {exploreCircles.length > 0 ? (
              exploreCircles.map((circle) => (
                <Card key={circle.id} variant="outlined" style={styles.exploreCard}>
                  <View style={styles.exploreHeader}>
                    <View style={styles.typeBadgeContainer}>
                      <Text style={styles.typeBadgeText}>{circle.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.joinText}>Public Pool</Text>
                  </View>
                  <Text style={styles.exploreName}>{circle.name}</Text>
                  <Text style={styles.exploreDesc}>A secure community savings pool.</Text>
                  <View style={styles.exploreFooter}>
                    <Text style={styles.exploreStats}>
                      {circle.contributionAmount.toLocaleString()} XAF/{circle.frequency === 'daily' ? 'd' : circle.frequency === 'weekly' ? 'wk' : 'mo'} • {circle.membersCount} Members
                    </Text>
                    <TouchableOpacity
                      style={styles.exploreJoinButton}
                      onPress={() => handleDirectJoin(circle)}
                      disabled={joiningId === circle.id}
                    >
                      <Text style={styles.exploreJoinText}>
                        {joiningId === circle.id ? "Joining..." : "Join"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.outline} />
                <Text style={styles.emptyTitle}>No public circles found</Text>
                <Text style={styles.emptySubtitle}>There are currently no public savings groups available to join.</Text>
              </View>
            )}
          </View>
        )}
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
    backgroundColor: colors.surfaceContainer,
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
  listSection: {
    gap: 16,
  },
  circleRowCard: {
    backgroundColor: colors.surface,
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
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainer,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: ROUNDED.sm,
    letterSpacing: 0.5,
  },
  treasurerBadge: {
    backgroundColor: colors.primaryContainer + "12",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: ROUNDED.sm,
  },
  treasurerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primaryContainer,
  },
  circleName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 6,
  },
  circleCode: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  dueBadge: {
    backgroundColor: colors.error + "15",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: ROUNDED.full,
  },
  dueText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.error,
  },
  paidBadge: {
    backgroundColor: colors.secondary + "15",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: ROUNDED.full,
  },
  paidText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.secondary,
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainer,
    padding: 12,
    borderRadius: ROUNDED.md,
  },
  statGroup: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payoutTimeline: {
    fontSize: 12,
    color: colors.secondary,
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
    borderColor: colors.surface,
  },
  moreAvatarsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  moreAvatarsText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
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
  exploreSection: {
    gap: 16,
  },
  exploreCard: {
    backgroundColor: colors.surface,
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
    color: colors.secondary,
  },
  exploreName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  exploreDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
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
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  exploreJoinButton: {
    backgroundColor: colors.primaryContainer,
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

