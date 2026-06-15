import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Button from "../components/Button";

export default function CreateEscrow() {
  const router = useRouter();
  const { createEscrowContract } = useApp();
  
  const [title, setSecTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [counterparty, setCounterparty] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a contract title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter contract description and terms");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Please enter a valid protection amount");
      return;
    }
    if (!counterparty.trim()) {
      Alert.alert("Error", "Please enter the counterparty details");
      return;
    }

    setLoading(true);
    try {
      const buyerName = role === "buyer" ? "You" : counterparty.trim();
      const sellerName = role === "seller" ? "You" : counterparty.trim();

      const newEscrow = await createEscrowContract(
        title.trim(),
        description.trim(),
        amountNum,
        role,
        buyerName,
        sellerName
      );

      Alert.alert(
        "Escrow Created",
        `Protection agreement "${newEscrow.title}" has been created. Invite code: ${newEscrow.code}`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/escrow") }]
      );
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to create escrow agreement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <TopNavBarComponent showBack title="New Escrow" />
          
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agreement Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Buying Used HP Laptop"
                placeholderTextColor={COLORS.outline}
                value={title}
                onChangeText={setSecTitle}
              />
            </View>

            {/* Role Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Role in this deal</Text>
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.roleTab, role === "buyer" && styles.roleTabActive]}
                  onPress={() => setRole("buyer")}
                >
                  <Text style={[styles.roleText, role === "buyer" && styles.roleTextActive]}>
                    I am the Buyer (Paying)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.roleTab, role === "seller" && styles.roleTabActive]}
                  onPress={() => setRole("seller")}
                >
                  <Text style={[styles.roleText, role === "seller" && styles.roleTextActive]}>
                    I am the Seller (Receiving)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Counterparty */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {role === "buyer" ? "Seller Name / Phone" : "Buyer Name / Phone"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={role === "buyer" ? "e.g. Frank (Seller)" : "e.g. Alice (Buyer)"}
                placeholderTextColor={COLORS.outline}
                value={counterparty}
                onChangeText={setCounterparty}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Protection Amount (XAF)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 120000"
                placeholderTextColor={COLORS.outline}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Terms Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description &amp; Protection Terms</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what is being bought, shipped, or delivered. Define when funds should be released (e.g. Upon verification of tracking number or physical inspection)."
                placeholderTextColor={COLORS.outline}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Create Escrow Protection"
            onPress={handleCreate}
            disabled={!title.trim() || !description.trim() || !amount || !counterparty.trim() || loading}
            loading={loading}
            type="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topSection: {
    flex: 1,
  },
  form: {
    marginTop: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  input: {
    height: 54,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.primary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  roleToggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.md,
    padding: 4,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ROUNDED.default,
  },
  roleTabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: "rgba(0,0,0,0.03)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  roleTextActive: {
    color: COLORS.primaryContainer,
    fontWeight: "700",
  },
  bottomSection: {
    marginTop: 20,
  },
});
