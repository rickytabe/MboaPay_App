import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Clipboard, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { COLORS, ROUNDED, SPACING, TYPOGRAPHY } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";

export default function AdminCircleDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { circles, payCircleContribution, approveCircleMember } = useApp();
  const [loading, setLoading] = useState(false);

  const circleId = params.id as string;
  const circle = circles.find((c) => c.id === circleId);

  if (!circle) {
    return (
      <View style={styles.errorContainer}>
        <TopNavBarComponent showBack title="Not Found" />
        <Text style={styles.errorText}>Savings Circle not found</Text>
      </View>
    );
  }

  // Check if "You" has paid
  const userMember = circle.members.find(
    (m) => m.name === "You" || m.name === "You (Pending)"
  );
  const userHasPaid = userMember ? userMember.paid : true;

  const handlePay = async () => {
    setLoading(true);
    try {
      await payCircleContribution(circleId);
      Alert.alert("Success", "Contribution paid successfully from your wallet balance.");
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e.message || "Insufficient wallet balance or payment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async () => {
    Alert.alert(
      "Confirm Disbursement",
      `Are you sure you want to disburse the total gathered pool of ${circle.goalAmount.toLocaleString()} XAF?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            Alert.alert("Disbursed", `The pool has been successfully queued for transfer.`);
          },
        },
      ]
    );
  };

  const handleCopyCode = () => {
    Clipboard.setString(circle.code);
    Alert.alert("Code Copied", `Invite code "${circle.code}" copied to clipboard.`);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my MboaPay Savings Circle!\nGroup: ${circle.name}\nInvite Code: ${circle.code}\nContribution: ${circle.contributionAmount.toLocaleString()} XAF`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleKickMember = (memberName: string) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${memberName} from this circle?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: () => Alert.alert("Success", "Member removed.") }
    ]);
  };

  const handleCancelCircle = () => {
    Alert.alert("Cancel Circle", "Are you sure you want to close this circle? All funds will be returned to members.", [
      { text: "Keep Open", style: "cancel" },
      { text: "Close Circle", style: "destructive", onPress: () => Alert.alert("Cancelled", "Circle has been marked as cancelled.") }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent showBack title={`Manage: ${circle.name}`} />

      {/* Admin Panel Banner */}
      <View style={styles.adminBadgeRow}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryContainer} />
        <Text style={styles.adminBadgeText}>Administrator View</Text>
      </View>

      {/* Circle Banner Card */}
      <Card variant="secondary" style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerLabel}>SAVINGS TARGET POOL</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{circle.type.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.poolAmount}>{circle.goalAmount.toLocaleString()} XAF</Text>
        <View style={styles.bannerFooter}>
          <Text style={styles.footerDetail}>{circle.frequency} contribution cycles</Text>
          <Text style={styles.footerDetail}>Next payout: {circle.nextPayoutDate}</Text>
        </View>
      </Card>

      {/* Details Box */}
      <Card variant="elevated" style={styles.detailCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Individual Contribution</Text>
          <Text style={styles.infoValue}>{circle.contributionAmount.toLocaleString()} XAF</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cycle Frequency</Text>
          <Text style={styles.infoValue}>{circle.frequency}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invite Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{circle.code}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.codeBtn}>
              <Ionicons name="copy-outline" size={16} color={COLORS.primaryContainer} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareCode} style={styles.codeBtn}>
              <Ionicons name="share-social-outline" size={16} color={COLORS.primaryContainer} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {!userHasPaid ? (
          <Button
            title={`Pay My Contribution (${circle.contributionAmount.toLocaleString()} XAF)`}
            onPress={handlePay}
            loading={loading}
            type="primary"
          />
        ) : (
          <View style={styles.paidInfoBox}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.paidInfoText}>Your contribution for this cycle is paid</Text>
          </View>
        )}

        <Button
          title="Manual Disbursement"
          onPress={handleDisburse}
          loading={loading}
          type="primary"
          style={styles.disburseBtn}
        />
        
        <Button
          title="Cancel Circle"
          onPress={handleCancelCircle}
          loading={loading}
          type="secondary"
          style={styles.cancelBtn}
        />
      </View>

      {/* Members Section */}
      <Text style={styles.sectionTitle}>Manage Members ({circle.membersCount}/{circle.maxMembers})</Text>

      <Card variant="outlined" style={styles.membersCard} noPadding>
        {circle.members.map((member, idx) => (
          <View key={idx}>
            <View style={styles.memberRow}>
              <View style={styles.memberLeft}>
                <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.role === "admin" && (
                    <Text style={styles.memberRoleLabel}>Administrator</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.memberRight}>
                {member.isPending ? (
                  <View style={styles.memberPendingBadge}>
                    <Text style={styles.memberPendingText}>Pending</Text>
                  </View>
                ) : member.paid ? (
                  <View style={styles.memberPaidBadge}>
                    <Text style={styles.memberPaidText}>Paid</Text>
                  </View>
                ) : (
                  <View style={styles.memberUnpaidBadge}>
                    <Text style={styles.memberUnpaidText}>Awaiting</Text>
                  </View>
                )}
                {member.isPending && member.role !== 'admin' ? (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        setLoading(true);
                        if (member.id) {
                          await approveCircleMember(member.id);
                          Alert.alert("Approved", `${member.name} has been approved.`);
                        }
                      } catch (e: any) {
                        Alert.alert("Error", e.message || "Could not approve member.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={styles.approveBtn}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                ) : member.name !== "You" ? (
                  <TouchableOpacity onPress={() => handleKickMember(member.name)} style={styles.kickBtn}>
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {idx < circle.members.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
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
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    alignItems: "center",
  },
  errorText: {
    marginTop: 40,
    fontSize: TYPOGRAPHY.bodyLg.fontSize,
    color: COLORS.error,
    fontWeight: "700",
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: ROUNDED.md,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer + '40',
  },
  adminBadgeText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  bannerCard: {
    marginBottom: 20,
    height: 140,
    justifyContent: "space-between",
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.sm,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  poolAmount: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  bannerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerDetail: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.sm,
  },
  codeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  actionArea: {
    marginBottom: 28,
    gap: 12,
  },
  disburseBtn: {
    marginTop: 4,
  },
  cancelBtn: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },
  paidInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary + "15",
    paddingVertical: 14,
    borderRadius: ROUNDED.md,
    gap: 8,
  },
  paidInfoText: {
    color: COLORS.secondary,
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  membersCard: {
    backgroundColor: COLORS.surface,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  memberRoleLabel: {
    fontSize: 10,
    color: COLORS.primaryContainer,
    fontWeight: "600",
    marginTop: 2,
  },
  memberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberPaidBadge: {
    backgroundColor: COLORS.secondary + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  memberPaidText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  memberPendingBadge: {
    backgroundColor: COLORS.primaryContainer + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  memberPendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  memberUnpaidBadge: {
    backgroundColor: COLORS.onSurfaceVariant + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.full,
  },
  memberUnpaidText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  approveBtn: {
    padding: 4,
  },
  kickBtn: {
    padding: 4,
  }
});
