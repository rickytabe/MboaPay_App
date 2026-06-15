import React, { useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Card from "../components/Card";

export default function PaymentPending() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { topUpWallet } = useApp();

  const amount = parseFloat(params.amount as string);
  const operator = params.operator as "MTN" | "Orange";

  useEffect(() => {
    let active = true;

    const processDeposit = async () => {
      if (isNaN(amount) || !operator) {
        router.replace("/(tabs)/wallet");
        return;
      }

      // Execute deposit and await mock resolution
      const txId = await topUpWallet(amount, operator);
      
      if (active) {
        router.replace({
          pathname: "/transaction-receipt",
          params: {
            txId,
            amount,
            operator,
            type: "deposit",
            title: "Wallet Top-up Successful",
          },
        });
      }
    };

    processDeposit();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TopNavBarComponent showBack={false} title="Processing Deposit" />
      </View>

      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} style={styles.loader} />
        
        <Text style={styles.title}>Confirm Payment</Text>
        <Text style={styles.subtitle}>
          A USSD push notification has been sent to your phone. Enter your PIN on your operator screen to approve the transaction.
        </Text>

        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Operator</Text>
            <Text style={[styles.value, operator === "MTN" ? { color: "#b38f00" } : { color: COLORS.orange }]}>
              {operator === "MTN" ? "MTN MoMo" : "Orange Money"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Deposit Amount</Text>
            <Text style={styles.value}>{amount.toLocaleString()} XAF</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: COLORS.tertiary }]}>Awaiting USSD PIN...</Text>
          </View>
        </Card>
      </View>

      <Text style={styles.footerNote}>Do not close the app or go back</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 44,
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loader: {
    marginBottom: 28,
  },
  title: {
    fontSize: TYPOGRAPHY.headlineLg.fontSize,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  infoCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  label: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  footerNote: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "600",
  },
});
