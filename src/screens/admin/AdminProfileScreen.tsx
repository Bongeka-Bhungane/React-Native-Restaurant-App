// src/screens/admin/AdminProfileScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import CozyInput from "../../components/CozyInput";
import CozyButton from "../../components/CozyButton";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { auth, db } from "../../config/firebase";

function safeStr(v: any, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

export default function AdminProfileScreen({ navigation }: any) {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // profile fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState("admin");

  // password change (optional)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const canSave = useMemo(() => {
    return (
      !!user &&
      !saving &&
      name.trim().length >= 2 &&
      surname.trim().length >= 2 &&
      contactNumber.trim().length >= 7
    );
  }, [user, saving, name, surname, contactNumber]);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data: any = snap.data();

          setName(safeStr(data?.name));
          setSurname(safeStr(data?.surname));
          setContactNumber(safeStr(data?.contactNumber));
          setEmail(safeStr(data?.email, user.email ?? ""));
          setRole(safeStr(data?.role, "admin"));
        } else {
          // fallback (auth only)
          setEmail(user.email ?? "");
          setRole("admin");
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login again.");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        surname: surname.trim(),
        contactNumber: contactNumber.trim(),

        // keep these consistent
        email: (user.email ?? email).trim().toLowerCase(),
        role: role || "admin",

        updatedAt: serverTimestamp(),
      });

      Alert.alert("Saved ✅", "Your admin profile has been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login again.");
      return;
    }

    if (currentPassword.trim().length < 6) {
      Alert.alert("Missing", "Enter your current password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert(
        "Weak password",
        "New password must be at least 6 characters.",
      );
      return;
    }

    try {
      setSaving(true);

      // Re-auth is required by Firebase before sensitive actions
      const credential = EmailAuthProvider.credential(
        user.email ?? "",
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");

      Alert.alert("Password updated ✅", "Your password has been changed.");
    } catch (e: any) {
      const msg =
        e?.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : e?.code === "auth/too-many-requests"
            ? "Too many attempts. Try again later."
            : e?.message || "Could not update password.";
      Alert.alert("Password change failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Adjust route name to your app
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message || "Could not logout.");
    }
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Profile</Text>
          <Text style={styles.subtitle}>Please login to continue</Text>
        </View>

        <CozyCard>
          <CozyButton
            label="Go to Login"
            onPress={() => navigation.navigate("Login")}
          />
        </CozyCard>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Admin Profile</Text>
          <Text style={styles.subtitle}>The Cozy Cup • Admin</Text>
        </View>

        <CozyCard>
          <Text style={styles.sectionTitle}>Details</Text>

          {loading ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading profile…</Text>
            </View>
          ) : (
            <>
              <CozyInput label="Name" value={name} onChangeText={setName} />
              <CozyInput
                label="Surname"
                value={surname}
                onChangeText={setSurname}
              />
              <CozyInput
                label="Contact number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                placeholder="e.g. 0812345678"
              />

              <View style={{ height: spacing.sm }} />

              <View style={styles.readOnlyBox}>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Email</Text>
                  <Text style={styles.readOnlyValue}>{email || "-"}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Role</Text>
                  <Text style={styles.readOnlyValue}>{role || "admin"}</Text>
                </View>
              </View>

              <View style={{ height: spacing.md }} />

              <CozyButton
                label={saving ? "Saving..." : "Save changes"}
                onPress={handleSave}
                disabled={!canSave}
                loading={saving}
              />
            </>
          )}
        </CozyCard>

        <View style={{ height: spacing.lg }} />

        {/* OPTIONAL: Change password */}
        <CozyCard>
          <Text style={styles.sectionTitle}>Change password</Text>

          <CozyInput
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
          />

          <CozyInput
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="min 6 characters"
          />

          <View style={{ height: spacing.md }} />

          <CozyButton
            label="Update password"
            onPress={handleChangePassword}
            disabled={saving}
            loading={saving}
          />

          <Text style={styles.muted}>
            You’ll be asked to re-authenticate using your current password.
          </Text>
        </CozyCard>

        <View style={{ height: spacing.lg }} />

        <CozyCard>
          <Text style={styles.sectionTitle}>Account</Text>

          <CozyButton
            label="Logout"
            variant="outline"
            onPress={handleLogout}
            disabled={saving}
          />
        </CozyCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  muted: { color: colors.muted, fontWeight: "700", marginTop: 8 },

  readOnlyBox: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(107, 74, 58, 0.06)",
  },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  readOnlyLabel: { color: colors.muted, fontWeight: "800" },
  readOnlyValue: { color: colors.text, fontWeight: "900", textAlign: "right" },
});
