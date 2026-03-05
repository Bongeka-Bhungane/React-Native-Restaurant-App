// src/screens/admin/AddAdminScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import CozyInput from "../../components/CozyInput";
import CozyButton from "../../components/CozyButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { auth, db } from "../../config/firebase";

const ALLOWED_ADMIN_DOMAIN = "@thecozycup.com";

function normalizeEmail(v: string) {
  return (v || "").trim().toLowerCase();
}

function isAllowedAdminEmail(email: string) {
  const e = normalizeEmail(email);
  return (
    e.endsWith(ALLOWED_ADMIN_DOMAIN) && e.length > ALLOWED_ADMIN_DOMAIN.length
  );
}

export default function AddAdminScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);

  const emailOk = useMemo(() => isAllowedAdminEmail(email), [email]);

  const canSubmit = useMemo(() => {
    const cleanEmail = normalizeEmail(email);
    return (
      !saving &&
      name.trim().length >= 2 &&
      surname.trim().length >= 2 &&
      contactNumber.trim().length >= 7 &&
      emailOk &&
      cleanEmail.length >= 5 &&
      password.length >= 6
    );
  }, [saving, name, surname, contactNumber, email, password, emailOk]);

  const handleCreateAdmin = async () => {
    const currentAdmin = auth.currentUser;
    if (!currentAdmin) {
      Alert.alert("Login required", "Please login as admin first.");
      return;
    }

    const cleanEmail = normalizeEmail(email);

    // ✅ Hard rule: must be company domain
    if (!isAllowedAdminEmail(cleanEmail)) {
      Alert.alert(
        "Not allowed",
        `Only ${ALLOWED_ADMIN_DOMAIN} emails may be added as admins.`,
      );
      return;
    }

    try {
      setSaving(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        role: "admin",

        name: name.trim(),
        surname: surname.trim(),
        email: cleanEmail,
        contactNumber: contactNumber.trim(),

        address: "",
        isActive: true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Admin created ✅",
        `New admin: ${cleanEmail}\n\nNote: Firebase signs you in as the new admin after creation. Logout and login back into your main admin account.`,
      );

      navigation.goBack();
    } catch (e: any) {
      console.log("🔥 create admin error:", e?.code, e?.message);

      const msg =
        e?.code === "auth/email-already-in-use"
          ? "That email is already registered."
          : e?.message || "Could not create admin.";

      Alert.alert("Create admin failed", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add Admin</Text>
            <Text style={styles.subtitle}>Only company emails allowed</Text>
          </View>

          <CozyCard>
            <Text style={styles.sectionTitle}>Admin details</Text>

            <CozyInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="First name"
            />

            <CozyInput
              label="Surname"
              value={surname}
              onChangeText={setSurname}
              placeholder="Surname"
            />

            <CozyInput
              label="Contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              placeholder="e.g. 0812345678"
            />

            <View style={{ height: spacing.sm }} />

            <Text style={styles.sectionTitle}>Login details</Text>

            <CozyInput
              label={`Email (must end with ${ALLOWED_ADMIN_DOMAIN})`}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={`name${ALLOWED_ADMIN_DOMAIN}`}
            />

            {!emailOk && email.trim().length > 0 ? (
              <Text style={styles.warn}>
                Email must end with {ALLOWED_ADMIN_DOMAIN}
              </Text>
            ) : null}

            <CozyInput
              label="Temporary password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="min 6 characters"
            />

            <View style={{ height: spacing.md }} />

            <CozyButton
              label={saving ? "Creating..." : "Create admin"}
              onPress={handleCreateAdmin}
              disabled={!canSubmit}
              loading={saving}
            />

            <View style={{ height: spacing.md }} />

            <CozyButton
              label="Back"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={saving}
            />

            <View style={{ height: spacing.sm }} />

            <Text style={styles.muted}>
              ⚠️ Creating an admin using{" "}
              <Text style={{ fontWeight: "900" }}>
                createUserWithEmailAndPassword
              </Text>{" "}
              will sign your app in as the new admin user. After creating,
              logout and login back into your main admin account.
            </Text>
          </CozyCard>
        </ScrollView>
      </KeyboardAvoidingView>
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

  warn: { marginTop: 6, color: colors.danger ?? "crimson", fontWeight: "900" },
  muted: { marginTop: spacing.sm, color: colors.muted, fontWeight: "700" },
});
