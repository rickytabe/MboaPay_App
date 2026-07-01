import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import Card from "./Card";
import { LIGHT_COLORS, ROUNDED } from "../constants/Theme";
import type { Circle } from "../context/types";

interface CircleCardComponentProps {
  circle: Circle;
  colors: typeof LIGHT_COLORS;
  fullWidth?: boolean;
}

export default function CircleCardComponent({ circle, colors, fullWidth = false }: CircleCardComponentProps) {
  const router = useRouter();
  const styles = getStyles(colors);

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

  const isSolo = circle.rawType === "solo";
  const isRotation = circle.rawType === "rotation";

  let currentSaved = 0;
  let targetAmount = 0;

  if (isRotation) {
    const paidCount = circle.members.filter((m) => m.paid).length;
    currentSaved = paidCount * circle.contributionAmount;
    targetAmount = circle.membersCount * circle.contributionAmount;
  } else {
    currentSaved = circle.totalContributed || 0;
    targetAmount = circle.goalAmount;
  }

  const progress = targetAmount > 0 ? currentSaved / targetAmount : 0;
  const progressPercent = currentSaved === 0 ? 0 : Math.min(Math.max(progress * 100, 8), 100);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/circle-detail/${circle.id}` as any)}
      style={fullWidth ? { width: '100%', marginBottom: 12 } : styles.circleCardWrapper}
    >
      <Card style={styles.circleCard} variant="outlined" noPadding>
        <View style={styles.circleCardContent}>
          {/* Header info inside circle card */}
          <View style={styles.circleCardHeader}>
            <View style={styles.circleIconContainer}>
              <Ionicons name={getCircleIcon(circle.name)} size={18} color={colors.primary} />
              <Text style={styles.circleCardName} numberOfLines={1}>
                {circle.name}
              </Text>
            </View>
            <Text style={styles.circleCardMembers}>
              {isSolo ? "1 member" : `${circle.membersCount}/${circle.maxMembers} members`}
            </Text>
          </View>

          {/* Middle Section: Progress and Balances */}
          <View style={styles.circleCardProgressSection}>
            <View style={styles.circleCardBalances}>
              <Text style={styles.circleCardCurrentBalance}>
                {currentSaved.toLocaleString()} XAF
              </Text>
              <Text style={styles.circleCardGoalBalance}>
                Goal: {targetAmount >= 1000 ? `${(targetAmount / 1000).toFixed(0)}k` : targetAmount}
              </Text>
            </View>

            {/* Custom Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.circleCardFooter}>
            <View>
              <Text style={styles.circleCardPrepayLabel}>{isSolo ? "Target date" : "Next payout"}</Text>
              <Text style={styles.circleCardPrepayDate}>
                {circle.nextPayoutDate.replace("In ", "").split(" (")[0]}
              </Text>
            </View>

            {/* User Avatars - Hidden for solo */}
            {!isSolo && (
              <View style={styles.avatarsList}>
                {circle.members.slice(0, 3).map((m, idx) => (
                  <View key={idx} style={{ marginLeft: idx > 0 ? -10 : 0 }}>
                    {m.avatar ? (
                      <Image
                        source={{ uri: m.avatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>
                          {m.name ? m.name.charAt(0).toUpperCase() : "?"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {circle.members.length > 3 && (
                  <View style={[styles.avatarFallback, { marginLeft: -10, backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={styles.avatarFallbackText}>+{circle.members.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
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
    height: 145,
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
  avatarsList: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
});
