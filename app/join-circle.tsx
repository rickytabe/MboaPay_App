import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Button from "../components/Button";

export default function JoinCircle() {
  const router = useRouter();
  const { joinCircle } = useApp();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert("Error", "Please enter a valid invite code");
      return;
    }

    setLoading(true);
    try {
      const joinedCircle = await joinCircle(cleanCode);
      if (joinedCircle) {
        Alert.alert(
          "Joined Successfully",
          `You have joined "${joinedCircle.name}" savings circle.`,
          [{ text: "OK", onPress: () => router.replace("/(tabs)/circles") }]
        );
      } else {
        Alert.alert(
          "Invalid Code",
          "No savings circle found with this code. Please verify the code and try again."
        );
      }
    } catch (e) {
      console.log(e);
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
          <TopNavBarComponent showBack title="Join Circle" />
          <View style={styles.content}>
            <Text style={styles.title}>Enter Invite Code</Text>
            <Text style={styles.subtitle}>
              Ask the group treasurer or admin for the invite code of the circle you want to join.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. TONT-7B93"
              placeholderTextColor={COLORS.outline}
              autoCapitalize="characters"
              autoCorrect={false}
              value={code}
              onChangeText={setCode}
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Join Savings Circle"
            onPress={handleJoin}
            disabled={!code.trim() || loading}
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
  input: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: SPACING.md,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: 2,
  },
  bottomSection: {
    marginTop: 20,
  },
});
