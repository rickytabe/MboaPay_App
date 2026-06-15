import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, TYPOGRAPHY } from "../constants/Theme";
import * as Haptics from "expo-haptics";

interface NumpadProps {
  onPressKey: (value: string) => void;
  onPressBackspace: () => void;
  onPressClear?: () => void;
}

export const Numpad = ({
  onPressKey,
  onPressBackspace,
  onPressClear,
}: NumpadProps) => {
  const handlePress = (value: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onPressKey(value);
  };

  const handleBackspace = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    onPressBackspace();
  };

  const handleClear = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    if (onPressClear) onPressClear();
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  return (
    <View style={styles.grid}>
      {keys.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((key, cIdx) => {
            if (key === "backspace") {
              return (
                <TouchableOpacity
                  key={cIdx}
                  onPress={handleBackspace}
                  onLongPress={handleClear}
                  style={styles.key}
                >
                  <Ionicons name="backspace-outline" size={26} color={COLORS.primary} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={cIdx}
                onPress={() => handlePress(key)}
                style={styles.key}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  key: {
    flex: 1,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.02)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 1,
  },
  keyText: {
    fontSize: TYPOGRAPHY.numeralLg.fontSize,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default Numpad;
