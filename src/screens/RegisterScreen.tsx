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

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import CozyInput from "../components/CozyInput";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { auth, db } from "../config/firebase";

function maskCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  if (!last4) return "";
  return `**** **** **** ${last4}`;
}

export default function RegisterScreen({ navigation }: any) {
  // required fields from spec
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // card (fake for testing)
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      surname.trim().length >= 2 &&
      contactNumber.trim().length >= 7 &&
      address.trim().length >= 5 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      !loading
    );
  }, [name, surname, contactNumber, address, email, password, loading]);

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert("Missing details", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name.trim(),
        surname: surname.trim(),
        email: cleanEmail,
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        card: {
          holder: cardHolder.trim(),
          numberMasked: maskCardNumber(cardNumber),
          exp: cardExp.trim(),
        },
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Account created", "Welcome to The Cozy Cup!");
      navigation.reset({ index: 0, routes: [{ name: "UserTabs" }] });
    } catch (err: any) {
      const msg = err?.message?.includes("auth/email-already-in-use")
        ? "This email is already registered."
        : err?.message || "Registration failed.";
      Alert.alert("Registration failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
          </View>

          <CozyCard>
            {/* Profile */}
            <CozyInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your first name"
            />
            <CozyInput
              label="Surname"
              value={surname}
              onChangeText={setSurname}
              placeholder="Enter your surname"
            />
            <CozyInput
              label="Contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
            />
            <CozyInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your delivery address"
            />

            <View style={{ height: spacing.sm }} />

            {/* Auth */}
            <CozyInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter a valid email address"
            />

            <CozyInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="min 6 characters"
            />

            <View style={{ height: spacing.sm }} />

            {/* Card */}
            <Text style={styles.sectionTitle}>Card details</Text>

            <CozyInput
              label="Card holder"
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Name on card"
            />

            <CozyInput
              label="Card number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              placeholder="e.g. 4242 4242 4242 4242"
            />

            <CozyInput
              label="Expiry"
              value={cardExp}
              onChangeText={setCardExp}
              placeholder="MM/YY"
            />

            <View style={{ height: spacing.md }} />

            <CozyButton
              label="Create account"
              onPress={handleRegister}
              loading={loading}
              disabled={!canSubmit}
            />

            <View style={{ height: spacing.md }} />

            <CozyButton
              label="Back to login"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={loading}
            />
          </CozyCard>

          {/* Extra bottom space so buttons aren’t trapped by home indicator/keyboard */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: { marginBottom: spacing.lg, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontWeight: "900",
    color: colors.text,
  },
});
