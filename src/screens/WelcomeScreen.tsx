// src/screens/WelcomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export default function WelcomeScreen({ navigation }: any) {
  return (
    <Screen>
      <View style={styles.container}>
        {/* Top Logo + Title */}
        <View style={styles.top}>
          <Text style={styles.logo}>☕</Text>
          <Text style={styles.title}>The Cozy Cup</Text>
          <Text style={styles.slogan}>Warm sips, cozy vibes.</Text>
        </View>

        {/* Center Card */}
        <View style={styles.cardWrapper}>
          <CozyCard>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardText}>
              Browse our menu, customize your order, and checkout in seconds.
            </Text>

            <View style={{ height: spacing.lg }} />

            <CozyButton
              label="Login"
              onPress={() => navigation.navigate("Login")}
            />

            <View style={{ height: spacing.md }} />

            <CozyButton
              label="Sign Up"
              variant="outline"
              onPress={() => navigation.navigate("Register")}
            />
          </CozyCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  top: {
    alignItems: "center",
    marginTop: spacing.xl,
    gap: 20,
  },

  cardWrapper: {
    flex: 1,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },

  logo: {
    fontSize: 46,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },

  slogan: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "700",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  cardText: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "600",
  },
});
