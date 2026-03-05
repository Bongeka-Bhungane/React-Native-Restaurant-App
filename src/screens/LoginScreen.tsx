import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import CozyInput from "../components/CozyInput";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { auth, db } from "../config/firebase";

type LoginMode = "user" | "admin";

function isCozyCupAdminEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@thecozycup.com");
}

export default function LoginScreen({ navigation }: any) {
  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    if (mode === "admin" && !isCozyCupAdminEmail(cleanEmail)) {
      Alert.alert(
        "Admin login blocked",
        "Admin accounts must use an email ending with @thecozycup.com",
      );
      return;
    }

    try {
      setLoading(true);

      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);

      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data()?.role : undefined;

      // ✅ Admin mode → go to AdminTabs -> Dashboard
      if (mode === "admin") {
        if (role !== "admin") {
          await signOut(auth);
          Alert.alert("Not an admin", "This account is not an admin yet.");
          return;
        }

        navigation.reset({
          index: 0,
          routes: [
            {
              name: "AdminTabs",
              params: { screen: "Dashboard" }, // 👈 go to Dashboard tab
            },
          ],
        });
        return;
      }

      // ✅ User mode
      // If admin accidentally logs in with user toggle, still route them to Dashboard
      if (role === "admin") {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "AdminTabs",
              params: { screen: "Dashboard" },
            },
          ],
        });
        return;
      }

      // ✅ Normal user → UserTabs -> Home
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "UserTabs",
            params: { screen: "Home" }, // 👈 go to Home tab
          },
        ],
      });
    } catch (err: any) {
      console.log("🔥 Login error:", err?.code, err?.message);

      const msg = err?.message?.includes("auth/invalid-credential")
        ? "Invalid email or password."
        : err?.message || "Login failed.";
      Alert.alert("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Welcome back to The Cozy Cup ☕</Text>
      </View>

      <CozyCard>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setMode("user")}
            style={[
              styles.toggleBtn,
              mode === "user" ? styles.toggleActive : styles.toggleInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "user"
                  ? styles.toggleTextActive
                  : styles.toggleTextInactive,
              ]}
            >
              User
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("admin")}
            style={[
              styles.toggleBtn,
              mode === "admin" ? styles.toggleActive : styles.toggleInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "admin"
                  ? styles.toggleTextActive
                  : styles.toggleTextInactive,
              ]}
            >
              Admin
            </Text>
          </Pressable>
        </View>

        {mode === "admin" && (
          <Text style={styles.adminHint}>
            Admin emails must end with{" "}
            <Text style={{ fontWeight: "900" }}>@thecozycup.com</Text>
          </Text>
        )}

        <View style={{ height: spacing.md }} />

        <CozyInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        <CozyInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <View style={{ height: spacing.md }} />

        <CozyButton
          label={mode === "admin" ? "Login as Admin" : "Login"}
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />

        <View style={{ height: spacing.md }} />

        <CozyButton
          label="Create a user account"
          variant="outline"
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
        />
      </CozyCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(107, 74, 58, 0.08)",
    borderRadius: radius.xl,
    padding: 6,
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleInactive: { backgroundColor: "transparent" },
  toggleText: { fontSize: 13, fontWeight: "900" },
  toggleTextActive: { color: colors.white },
  toggleTextInactive: { color: colors.primary },

  adminHint: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
});
