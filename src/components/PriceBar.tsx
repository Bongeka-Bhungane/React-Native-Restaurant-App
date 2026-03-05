// src/components/PriceBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import CozyButton from "./CozyButton";
import { shadow } from "../theme/shadow";

type Props = {
  totalLabel?: string;
  totalValue: string; // e.g. "R 145.00"
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PriceBar({
  totalLabel = "Total",
  totalValue,
  buttonLabel,
  onPress,
  disabled,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View>
          <Text style={styles.totalLabel}>{totalLabel}</Text>
          <Text style={styles.totalValue}>{totalValue}</Text>
        </View>

        <CozyButton
          label={buttonLabel}
          onPress={onPress}
          disabled={disabled}
          style={{ minWidth: 150 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  totalLabel: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  totalValue: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 2,
  },
});
