import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import TopNavBarComponent from "../components/TopNavBarComponent";

const AVATAR_OPTIONS = [
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=47",
  "https://i.pravatar.cc/150?img=60",
];

export default function ProfileSetup() {
  const router = useRouter();
  const { updateProfile, user } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState("");

  const handleComplete = () => {
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    setError("");
    
    // Set user profile info and login
    updateProfile(name.trim(), email.trim());
    
    // Redirect to home dashboard
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <TopNavBarComponent showBack title="Profile Setup" />
          <View style={styles.content}>
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>
              Set up your details to get started with savings and transfers.
            </Text>

            {/* Avatar Selector */}
            <View style={styles.avatarSection}>
              <View style={styles.currentAvatarContainer}>
                <Image source={{ uri: selectedAvatar }} style={styles.currentAvatar} />
              </View>
              <Text style={styles.avatarLabel}>Choose an Avatar</Text>
              <View style={styles.avatarList}>
                {AVATAR_OPTIONS.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setSelectedAvatar(url)}
                    style={[
                      styles.avatarOptionWrapper,
                      selectedAvatar === url && styles.avatarOptionSelected,
                    ]}
                  >
                    <Image source={{ uri: url }} style={styles.avatarOption} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="e.g. John Ndi"
                  placeholderTextColor={COLORS.outline}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (text) setError("");
                  }}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john@domain.com"
                  placeholderTextColor={COLORS.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Complete Setup"
            onPress={handleComplete}
            disabled={!name.trim()}
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
    marginTop: 20,
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
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  currentAvatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    marginBottom: 12,
  },
  currentAvatar: {
    width: "100%",
    height: "100%",
  },
  avatarLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  avatarList: {
    flexDirection: "row",
    gap: 10,
  },
  avatarOptionWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: COLORS.secondary,
  },
  avatarOption: {
    width: "100%",
    height: "100%",
  },
  form: {
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
    height: 56,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomSection: {
    marginTop: 20,
  },
});
