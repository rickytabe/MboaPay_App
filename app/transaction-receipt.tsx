import React from "react";
import { StyleSheet, Text, View, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import Card from "../components/Card";

export default function TransactionReceipt() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const amount = parseFloat(params.amount as string);
  const operator = params.operator as string;
  const txId = params.txId as string;
  const title = params.title as string || "Transaction Completed";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `MboaPay Receipt:\nStatus: Success\nTransaction: ${title}\nAmount: ${amount.toLocaleString()} XAF\nOperator: ${operator}\nTx ID: ${txId}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Circle */}
        <View style={styles.successIconWrapper}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={42} color="#ffffff" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Your transaction was processed successfully.</Text>

        {/* Receipt Details Card */}
        <Card variant="elevated" style={styles.receiptCard}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Deposited</Text>
            <Text style={styles.amountValue}>{amount.toLocaleString()} XAF</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{txId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network Provider</Text>
            <Text style={styles.detailValue}>{operator === "MTN" ? "MTN MoMo" : "Orange Money"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date &amp; Time</Text>
            <Text style={styles.detailValue}>{dateStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValueGreen}>0 XAF</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>SUCCESS</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Share Receipt"
          onPress={handleShare}
          type="outlined"
          style={styles.shareBtn}
        />
        <Button
          title="Done"
          onPress={() => router.replace("/(tabs)/wallet")}
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    alignItems: "center",
    marginTop: 60,
  },
  successIconWrapper: {
    marginBottom: 20,
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  successIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.headlineLg.fontSize,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    padding: 20,
    gap: 14,
  },
  amountContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  detailValueGreen: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  statusBadge: {
    backgroundColor: COLORS.secondary + "15",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginVertical: 4,
  },
  bottomSection: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 40,
    gap: 12,
  },
  shareBtn: {
    marginBottom: 4,
  },
});
