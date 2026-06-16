import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
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
  const [counterpartyPhone, setCounterpartyPhone] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCounterparty = async () => {
      const cleanPhone = counterpartyPhone.replace(/[^0-9]/g, "");
      let formattedPhone = "";
      
      if (cleanPhone.length >= 9) {
        const basePhone = cleanPhone.length === 12 && cleanPhone.startsWith("237") 
          ? cleanPhone.slice(3) 
          : cleanPhone.slice(-9);
        formattedPhone = `+237${basePhone}`;
      }

      if (formattedPhone) {
        setIsValidatingPhone(true);
        setPhoneError("");
        setCounterpartyName("");
        
        try {
          const { data, error } = await supabase
            .from("users")
            .select("full_name")
            .eq("phone", formattedPhone)
            .maybeSingle();

          if (error || !data) {
            setPhoneError("User not found on MboaPay.");
          } else {
            setCounterpartyName(data.full_name);
          }
        } catch (err) {
          setPhoneError("Error checking user.");
        } finally {
          setIsValidatingPhone(false);
        }
      } else {
        setCounterpartyName("");
        setPhoneError("");
      }
    };

    const timeoutId = setTimeout(fetchCounterparty, 500);
    return () => clearTimeout(timeoutId);
  }, [counterpartyPhone]);

  const handleCreate = async () => {
    Keyboard.dismiss();
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
    if (!counterpartyPhone.trim() || !counterpartyName) {
      Alert.alert("Error", "Please enter a valid MboaPay counterparty phone number");
      return;
    }

    setLoading(true);
    try {
      await createEscrowContract(
        title.trim(),
        description.trim(),
        amountNum,
        counterpartyPhone.trim(),
        role
      );

      Alert.alert(
        "Escrow Created",
        `Protection agreement "${title.trim()}" has been created.`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/escrow") }]
      );
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e.message || "Failed to create escrow agreement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
                {role === "buyer" ? "Seller's Phone Number" : "Buyer's Phone Number"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 670000000"
                placeholderTextColor={COLORS.outline}
                keyboardType="phone-pad"
                value={counterpartyPhone}
                onChangeText={setCounterpartyPhone}
              />
              {isValidatingPhone && (
                <Text style={styles.validationText}>Finding user...</Text>
              )}
              {!isValidatingPhone && counterpartyName ? (
                <Text style={styles.successText}>Found: {counterpartyName}</Text>
              ) : null}
              {!isValidatingPhone && phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
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
            disabled={!title.trim() || !description.trim() || !amount || !counterpartyPhone.trim() || !counterpartyName || loading}
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
  validationText: {
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: COLORS.primary || "#4CAF50",
    marginTop: 4,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error || "#F44336",
    marginTop: 4,
  },
});
