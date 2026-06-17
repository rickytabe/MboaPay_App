import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopNavBarComponent from "../../components/TopNavBarComponent";
import { COLORS, ROUNDED, SPACING } from "../../constants/Theme";
import { useApp } from "../../context/AppContext";
import { getTransactionStyle, getTransactionSubtitle } from "../../constants/TransactionVocabulary";

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { transactions } = useApp();

  const transaction = transactions.find((tx) => tx.id === id);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavBarComponent showBack title="Transaction Details" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Transaction not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const styleInfo = getTransactionStyle(transaction.type);
  const sub = getTransactionSubtitle(transaction);
  const isInflow = styleInfo.isCredit;

  return (
    <SafeAreaView style={styles.container}>
      <TopNavBarComponent showBack title="Transaction Details" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={[styles.iconContainer, { backgroundColor: styleInfo.bgColor }]}>
            <Ionicons name={styleInfo.ionicIcon} size={32} color={styleInfo.color} />
          </View>
          <Text style={styles.title}>{styleInfo.title}</Text>
          <Text style={[styles.amount, isInflow ? styles.txPositive : styles.txNegative]}>
            {isInflow ? "+" : "-"} {transaction.amount.toLocaleString()} XAF
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: transaction.status === 'successful' ? COLORS.secondaryContainer : COLORS.surfaceContainer }]}>
            <Text style={[styles.statusText, { color: transaction.status === 'successful' ? COLORS.secondary : COLORS.onSurfaceVariant }]}>
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{transaction.date}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{styleInfo.title}</Text>
          </View>
          <View style={styles.divider} />

          {transaction.metadata?.recipientName && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{transaction.metadata.recipientName}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {transaction.metadata?.senderName && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sender</Text>
                <Text style={styles.detailValue}>{transaction.metadata.senderName}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {transaction.metadata?.note ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.metadata.note}</Text>
            </View>
          ) : sub ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Summary</Text>
              <Text style={styles.detailValue}>{sub}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.containerPadding,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.lg,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 16,
  },
  txPositive: {
    color: COLORS.secondary,
  },
  txNegative: {
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ROUNDED.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.lg,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    flex: 2,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
});
