// src/components/CozyInput.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export default function CozyInput({ label, error, style, ...props }: Props) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, !!error && styles.inputError, style as any]}
        {...props}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
  },
  inputError: {
    borderColor: "rgba(217, 83, 79, 0.6)",
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
});
