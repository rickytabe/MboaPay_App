import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import TopNavBarComponent from "../components/TopNavBarComponent";

export default function Register() {
  const router = useRouter();
  const { login } = useApp();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (phone.length < 9) {
      setError("Please enter a valid 9-digit phone number");
      return;
    }
    setError("");
    login(`+237 ${phone}`);
    router.push("/otp");
  };

  const handleTextChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 9) {
      setPhone(cleaned);
      if (cleaned.length >= 9) {
        setError("");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <TopNavBarComponent showBack title="Registration" />
          <View style={styles.content}>
            <Text style={styles.title}>Enter Phone Number</Text>
            <Text style={styles.subtitle}>
              MboaPay will send an SMS to verify your mobile money account.
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇨🇲 +237</Text>
              </View>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="6XX XX XX XX"
                placeholderTextColor={COLORS.outline}
                keyboardType="number-pad"
                value={phone}
                onChangeText={handleTextChange}
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.networkBadgeContainer}>
              <Text style={styles.networkText}>Supports Cameroon Mobile Wallets:</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: COLORS.mtn + "20" }]}>
                  <Text style={[styles.badgeText, { color: "#b38f00" }]}>MTN MoMo</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: COLORS.orange + "20" }]}>
                  <Text style={[styles.badgeText, { color: COLORS.orange }]}>Orange Money</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={phone.length < 9}
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
  content: {
    marginTop: 30,
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
    lineHeight: 20,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    height: 56,
  },
  countryCode: {
    width: 90,
    height: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  input: {
    flex: 1,
    height: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: SPACING.md,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  networkBadgeContainer: {
    marginTop: 40,
    gap: 12,
  },
  networkText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  badges: {
    flexDirection: "row",
    gap: 12,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: ROUNDED.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bottomSection: {
    marginTop: 20,
  },
});
