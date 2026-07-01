import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Numpad from "../components/Numpad";
import TopNavBarComponent from "../components/TopNavBarComponent";
import { COLORS, SPACING } from "../constants/Theme";
import { useApp } from "../context/AppContext";

export default function Topup() {
  const router = useRouter();
  const { selectedOperator, setOperator, topUpWallet } = useApp();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (val: string) => {
    if (val === ".") {
      if (amount.includes(".")) return;
      if (amount === "") {
        setAmount("0.");
        return;
      }
    }
    
    // Prevent typing large amounts
    if (amount.replace(".", "").length >= 11) return;

    if (amount === "0" && val !== ".") {
      setAmount(val);
    } else {
      setAmount((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setAmount((prev) => {
      if (prev.length <= 1) return "";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setAmount("");
  };

  const handleTopup = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;

    setLoading(true);
    
    // Navigate to pending screen first to simulate USSD prompt waiting
    router.push({
      pathname: "/payment-pending",
      params: {
        amount: value,
        operator: selectedOperator,
      },
    });
  };

  const displayVal = amount === "" ? "0" : parseFloat(amount).toLocaleString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TopNavBarComponent showBack title="Top-up Wallet" />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Network Operator</Text>
        <View style={styles.detectedRow}>
          <Text style={styles.detectedText}>Detected MNO: {selectedOperator}</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountDisplay}>
          <Text style={styles.currency}>XAF</Text>
          <Text style={styles.amountText} numberOfLines={1}>{displayVal}</Text>
        </View>

        <Text style={styles.feeLabel}>Transaction fee: 0 XAF</Text>
      </View>

      <View style={styles.bottomSection}>
        <Numpad
          onPressKey={handleKeyPress}
          onPressBackspace={handleBackspace}
          onPressClear={handleClear}
        />

        <Button
          title={`Deposit ${displayVal} XAF`}
          onPress={handleTopup}
          disabled={amount === "" || parseFloat(amount) <= 0 || loading}
          loading={loading}
          type="primary"
          style={styles.depositButton}
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
  header: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 44,
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    alignItems: "center",
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  detectedText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  changeLink: {
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: 8,
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 8,
    gap: 8,
    width: "100%",
  },
  currency: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  amountText: {
    fontSize: 54,
    fontWeight: "800",
    color: COLORS.primary,
  },
  feeLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "700",
  },
  bottomSection: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 24,
  },
  depositButton: {
    marginTop: 16,
  },
});
