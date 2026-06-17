import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { shareAsync } from "expo-sharing";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import React from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Card from "../components/Card";
import { LIGHT_COLORS, ROUNDED, SPACING, TYPOGRAPHY } from "../constants/Theme";
import { useApp } from "../context/AppContext";

export default function TransactionReceipt() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useApp();
  const styles = getStyles(colors);

  const amount = parseFloat(params.amount as string);
  const operator = params.operator as string;
  const txId = params.txId as string;
  const title = (params.title as string) || "Transaction Completed";
  const recipientName = params.recipientName as string | undefined;
  const recipientPhone = params.recipientPhone as string | undefined;
  const displayRecipient = recipientName || recipientPhone || "Recipient";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `MboaPay Receipt:\nStatus: Success\nTransaction: ${title}\nAmount: ${amount.toLocaleString()} XAF\nRecipient Name: ${recipientName || 'N/A'}\nRecipient Phone: ${recipientPhone || 'N/A'}\nOperator: ${operator}\nTx ID: ${txId}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const titleSize = 24;
      const regularSize = 12;
      const leftX = 48;
      let y = 740;

      page.drawText("MboaPay Receipt", {
        x: leftX,
        y,
        size: titleSize,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= 40;

      page.drawText(`Date: ${new Date().toLocaleString("en-GB")}`, {
        x: leftX,
        y,
        size: regularSize,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
      y -= 24;

      page.drawText(`Transaction: ${title}`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Amount: ${amount.toLocaleString()} XAF`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Recipient Name: ${recipientName || 'N/A'}`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Recipient Phone: ${recipientPhone || 'N/A'}`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Operator: ${operator === "MTN" ? "MTN MoMo" : "Orange Money"}`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Transaction ID: ${txId}`, { x: leftX, y, size: regularSize, font });
      y -= 20;
      page.drawText(`Status: SUCCESS`, { x: leftX, y, size: regularSize, font, color: rgb(0, 0.55, 0.2) });

      const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: false });
      const fileRoot = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || "";
      const fileUri = `${fileRoot}mboapay_receipt_${txId}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
        encoding: "base64",
      });

      await shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Download MboaPay Receipt",
      });
    } catch (error) {
      console.log("Receipt PDF error", error);
      Alert.alert("Receipt failed", "Unable to create the receipt PDF. Please try again.");
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
            <Text style={styles.detailLabel}>Recipient Name</Text>
            <Text style={styles.detailValue}>{recipientName || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient Phone</Text>
            <Text style={styles.detailValue}>{recipientPhone || "N/A"}</Text>
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
          title="Download PDF"
          onPress={handleDownloadReceipt}
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

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  successIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.headlineLg.fontSize,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.surface,
    padding: 20,
    gap: 14,
  },
  amountContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  detailValueGreen: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },
  statusBadge: {
    backgroundColor: colors.secondary + "15",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
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
