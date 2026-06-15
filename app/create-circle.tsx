import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Button from "../components/Button";

const FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"];

export default function CreateCircle() {
  const router = useRouter();
  const { createCircle } = useApp();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [contribution, setContribution] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [maxMembers, setMaxMembers] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a circle name");
      return;
    }
    const goalNum = parseFloat(goal);
    const contribNum = parseFloat(contribution);
    const membersNum = parseInt(maxMembers);

    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert("Error", "Please enter a valid target goal amount");
      return;
    }
    if (isNaN(contribNum) || contribNum <= 0) {
      Alert.alert("Error", "Please enter a valid contribution amount");
      return;
    }
    if (isNaN(membersNum) || membersNum < 2) {
      Alert.alert("Error", "Minimum number of members is 2");
      return;
    }

    setLoading(true);
    try {
      const newCircle = await createCircle(name.trim(), goalNum, contribNum, frequency, membersNum);
      Alert.alert(
        "Circle Created",
        `"${newCircle.name}" has been created successfully. Use code "${newCircle.code}" to invite members.`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/circles") }]
      );
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to create savings circle.");
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
          <TopNavBarComponent showBack title="Create Circle" />
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Circle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dschang Alumni Savings"
                placeholderTextColor={COLORS.outline}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Target Pool (XAF)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500000"
                  placeholderTextColor={COLORS.outline}
                  keyboardType="numeric"
                  value={goal}
                  onChangeText={setGoal}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Contribution (XAF)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50000"
                  placeholderTextColor={COLORS.outline}
                  keyboardType="numeric"
                  value={contribution}
                  onChangeText={setContribution}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contribution Frequency</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqButton,
                      frequency === freq && styles.freqButtonSelected,
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.freqText,
                        frequency === freq && styles.freqTextSelected,
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Members</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                placeholderTextColor={COLORS.outline}
                keyboardType="numeric"
                value={maxMembers}
                onChangeText={setMaxMembers}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Create Savings Circle"
            onPress={handleCreate}
            disabled={!name.trim() || !goal || !contribution || loading}
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  freqRow: {
    flexDirection: "row",
    gap: 10,
  },
  freqButton: {
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
  },
  freqButtonSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer + "10",
  },
  freqText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  freqTextSelected: {
    color: COLORS.primaryContainer,
    fontWeight: "700",
  },
  bottomSection: {
    marginTop: 20,
  },
});
