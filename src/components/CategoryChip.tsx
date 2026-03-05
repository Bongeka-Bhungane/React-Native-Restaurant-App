// src/components/CategoryChip.tsx
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export default function CategoryChip({
  label,
  selected,
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  text: { fontSize: 13, fontWeight: "800" },
  textSelected: { color: colors.white },
  textUnselected: { color: colors.primary },
});
