import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../../constants/Theme";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function EscrowDetail() {
  const params = useLocalSearchParams();
  const { escrows, lockEscrowFunds, requestEscrowRelease, releaseEscrowContract, disputeEscrowContract } = useApp();
  const [loading, setLoading] = useState(false);

  const escrowId = params.id as string;
  const contract = escrows.find((e) => e.id === escrowId);

  if (!contract) {
    return (
      <View style={styles.errorContainer}>
        <TopNavBarComponent showBack title="Not Found" />
        <Text style={styles.errorText}>Escrow contract not found</Text>
      </View>
    );
  }

  const handleLockFunds = async () => {
    setLoading(true);
    try {
      await lockEscrowFunds(escrowId);
      Alert.alert("Success", "Funds locked successfully inside protection escrow.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to lock funds. Please check your balance and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    Alert.alert(
      "Confirm Fund Release",
      "Approve the seller's release request only if delivery is complete. The funds will move to the seller and this action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release Funds",
          onPress: async () => {
            setLoading(true);
            try {
              await releaseEscrowContract(escrowId);
              Alert.alert("Funds Released", "The seller has been paid successfully.");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to release funds. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestRelease = () => {
    Alert.alert(
      "Request Fund Release",
      "Confirm that you have delivered the goods or service. The buyer will be asked to approve release or open a dispute.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Release",
          onPress: async () => {
            setLoading(true);
            try {
              await requestEscrowRelease(escrowId);
              Alert.alert("Release Requested", "The buyer has been asked to review and approve the escrow release.");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to request release.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDispute = () => {
    Alert.alert(
      "Open Dispute",
      "This will reject the release request and freeze the escrow for review. Funds will not be refunded automatically.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Raise Dispute",
          onPress: async () => {
            setLoading(true);
            try {
              await disputeEscrowContract(escrowId);
              Alert.alert("Dispute Logged", "Support has been notified. Funds remain frozen.");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to raise dispute.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    if (status === "locked" && !contract.pawapayDepositId) {
      return "AWAITING FUNDING";
    }
    if (status === "locked" && contract.recipientConfirm === "confirmed") {
      return "RELEASE REQUESTED";
    }

    switch (status) {
      case "locked":
        return "SECURED & ESCROWED";
      case "disputed":
        return "UNDER DISPUTE";
      case "released":
        return "COMPLETED & RELEASED";
      case "refunded":
        return "REFUNDED";
      default:
        return "ACTIVE";
    }
  };

  const isBuyer = contract.role === "buyer";
  const isSeller = contract.role === "seller";
  const isFunded = Boolean(contract.pawapayDepositId);
  const hasReleaseRequest = contract.recipientConfirm === "confirmed";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent showBack title="Contract Details" />

      {/* Contract Core Info */}
      <Card
        variant={contract.status === "disputed" ? "primary" : "elevated"}
        style={[
          styles.mainCard,
          contract.status === "disputed"
            ? { backgroundColor: COLORS.error }
            : contract.status === "released"
            ? { backgroundColor: COLORS.secondary }
            : contract.status === "refunded"
            ? { backgroundColor: "rgba(234, 88, 12, 0.15)" }
            : { backgroundColor: COLORS.primaryContainer }
        ] as any}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardStatusLabel}>{getStatusLabel(contract.status)}</Text>
          <Text style={styles.cardCode}>{contract.code}</Text>
        </View>
        <Text style={styles.cardAmount}>{contract.amount.toLocaleString()} XAF</Text>
        
        <View style={styles.participantsRow}>
          <View style={styles.participant}>
            <Text style={styles.participantLabel}>Buyer</Text>
            <Text style={styles.participantValue}>{contract.role === 'buyer' ? 'You' : contract.otherParty}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
          <View style={styles.participant}>
            <Text style={styles.participantLabel}>Seller</Text>
            <Text style={styles.participantValue}>{contract.role === 'seller' ? 'You' : contract.otherParty}</Text>
          </View>
        </View>
      </Card>

      {/* Milestone/Status Stepper */}
      <Card variant="outlined" style={styles.stepperCard}>
        <Text style={styles.sectionTitle}>Milestone Tracker</Text>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, isFunded && styles.stepDotActive]}>
            {isFunded ? (
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            ) : (
              <Text style={styles.stepNum}>1</Text>
            )}
          </View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, isFunded && styles.stepTextActive]}>
              Funds Locked
            </Text>
            <Text style={styles.stepDesc}>Buyer deposits the amount in MboaPay Escrow protection vault</Text>
          </View>
        </View>

        <View style={[styles.stepConnector, isFunded && styles.stepConnectorActive]} />

        <View style={styles.stepRow}>
          <View
            style={[
              styles.stepDot,
              hasReleaseRequest &&
                styles.stepDotActive,
            ]}
          >
            {hasReleaseRequest ? (
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            ) : (
              <Text style={styles.stepNum}>2</Text>
            )}
          </View>
          <View style={styles.stepInfo}>
            <Text
              style={[
                styles.stepTitle,
                hasReleaseRequest &&
                  styles.stepTextActive,
              ]}
            >
              Seller Release Request
            </Text>
            <Text style={styles.stepDesc}>Seller marks delivery complete and asks the buyer to review</Text>
          </View>
        </View>

        <View style={[styles.stepConnector, contract.status === "released" && styles.stepConnectorActive]} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, contract.status === "released" && styles.stepDotActive]}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, contract.status === "released" && styles.stepTextActive]}>
              Buyer Decision
            </Text>
            <Text style={styles.stepDesc}>Buyer approves release or opens a dispute; no automatic refund on rejection</Text>
          </View>
        </View>
      </Card>

      {/* Description Details */}
      <Card variant="elevated" style={styles.descriptionCard}>
        <Text style={styles.descTitle}>{contract.title}</Text>
        <Text style={styles.descBody}>{contract.description}</Text>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Created Date</Text>
          <Text style={styles.metaValue}>{contract.date}</Text>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {contract.status === "locked" && isBuyer && !isFunded && (
          <Button
            title={`Lock Funds (${contract.amount.toLocaleString()} XAF)`}
            onPress={handleLockFunds}
            loading={loading}
            type="primary"
          />
        )}

        {contract.status === "locked" && isSeller && isFunded && !hasReleaseRequest && (
          <Button
            title="Request Release from Buyer"
            onPress={handleRequestRelease}
            loading={loading}
            type="primary"
          />
        )}

        {contract.status === "locked" && isSeller && !isFunded && (
          <View style={styles.pendingInfoBox}>
            <Ionicons name="time-outline" size={22} color={COLORS.tertiary} />
            <Text style={styles.pendingInfoText}>
              Waiting for the buyer to lock funds. You can request release after the escrow is funded and delivery is complete.
            </Text>
          </View>
        )}

        {contract.status === "locked" && isSeller && isFunded && hasReleaseRequest && (
          <View style={styles.pendingInfoBox}>
            <Ionicons name="hourglass-outline" size={22} color={COLORS.tertiary} />
            <Text style={styles.pendingInfoText}>
              Release request sent. The buyer can approve release or open a dispute. Funds remain locked until then.
            </Text>
          </View>
        )}

        {contract.status === "locked" && isBuyer && isFunded && !hasReleaseRequest && (
          <View style={styles.pendingInfoBox}>
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.tertiary} />
            <Text style={styles.pendingInfoText}>
              Funds are locked. Wait for the seller to request release after delivery.
            </Text>
          </View>
        )}

        {contract.status === "locked" && isBuyer && isFunded && hasReleaseRequest && (
          <View style={styles.buyerActionGroup}>
            <Button
              title="Approve Release to Seller"
              onPress={handleRelease}
              loading={loading}
              type="primary"
            />
            <Button
              title="Open Dispute"
              onPress={handleDispute}
              loading={loading}
              type="outlined"
              style={styles.disputeBtn}
            />
          </View>
        )}

        {contract.status === "disputed" && (
          <View style={styles.disputeInfoBox}>
            <Ionicons name="alert-circle" size={22} color={COLORS.error} />
            <Text style={styles.disputeInfoText}>
              This agreement is frozen. MboaPay support team is reviewing the chat logs and shipping verification inputs to resolve the dispute.
            </Text>
          </View>
        )}

        {contract.status === "released" && (
          <View style={styles.releasedInfoBox}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.secondary} />
            <Text style={styles.releasedInfoText}>
              This protection escrow has closed. Funds are disbursed to the seller mobile wallet.
            </Text>
          </View>
        )}

        {contract.status === "refunded" && (
          <View style={styles.refundedInfoBox}>
            <Ionicons name="refresh-circle" size={22} color="#ea580c" />
            <Text style={styles.refundedInfoText}>
              This protection escrow has been refunded. The amount is returned to the buyer before final seller payout.
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
  mainCard: {
    marginTop: 16,
    marginBottom: 20,
    height: 154,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardStatusLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardCode: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
  },
  cardAmount: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  participantsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: ROUNDED.md,
  },
  participant: {
    gap: 2,
  },
  participantLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  participantValue: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
  },
  stepperCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  stepTextActive: {
    color: COLORS.primary,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
  },
  stepConnector: {
    width: 2,
    height: 22,
    backgroundColor: COLORS.outlineVariant,
    marginLeft: 11,
    marginVertical: 4,
  },
  stepConnectorActive: {
    backgroundColor: COLORS.secondary,
  },
  descriptionCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    gap: 12,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  descBody: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  metaValue: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  actionsContainer: {
    marginBottom: 28,
  },
  buyerActionGroup: {
    gap: 12,
  },
  disputeBtn: {
    borderColor: COLORS.error,
  },
  disputeInfoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.error + "12",
    padding: 14,
    borderRadius: ROUNDED.md,
    gap: 10,
    alignItems: "flex-start",
  },
  disputeInfoText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  pendingInfoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.tertiary + "12",
    padding: 14,
    borderRadius: ROUNDED.md,
    gap: 10,
    alignItems: "flex-start",
  },
  pendingInfoText: {
    flex: 1,
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  releasedInfoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary + "12",
    padding: 14,
    borderRadius: ROUNDED.md,
    gap: 10,
    alignItems: "flex-start",
  },
  releasedInfoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  refundedInfoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(234, 88, 12, 0.12)",
    padding: 14,
    borderRadius: ROUNDED.md,
    gap: 10,
    alignItems: "flex-start",
  },
  refundedInfoText: {
    flex: 1,
    color: "#92400e",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
});
