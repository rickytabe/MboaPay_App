import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";

interface MNOToggleProps {
  selected: "MTN" | "Orange";
  onChange: (operator: "MTN" | "Orange") => void;
}

export const MNOToggle = ({ selected, onChange }: MNOToggleProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange("MTN")}
        style={[
          styles.tab,
          selected === "MTN" && { backgroundColor: COLORS.mtn },
        ]}
      >
        <Text
          style={[
            styles.label,
            selected === "MTN" ? styles.selectedLabelMTN : styles.unselectedLabel,
          ]}
        >
          MTN MoMo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange("Orange")}
        style={[
          styles.tab,
          selected === "Orange" && { backgroundColor: COLORS.orange },
        ]}
      >
        <Text
          style={[
            styles.label,
            selected === "Orange" ? styles.selectedLabelOrange : styles.unselectedLabel,
          ]}
        >
          Orange Money
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.md,
    padding: 4,
    height: 54,
    alignItems: "center",
    width: "100%",
  },
  tab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ROUNDED.default,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  selectedLabelMTN: {
    color: "#00113a", // high contrast text on MTN yellow
  },
  selectedLabelOrange: {
    color: "#ffffff", // white text on orange background
  },
  unselectedLabel: {
    color: COLORS.onSurfaceVariant,
  },
});

export default MNOToggle;
