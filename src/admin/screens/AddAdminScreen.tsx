import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { colors } from "../../theme/colors";
import { showSuccess, showError } from "../../utils/toast";

export default function AddAdminScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async () => {
    if (!name || !surname || !email || !password) {
      showError("Please fill in all fields");
      return;
    }

    if (!email.endsWith("@thecozycup.com")) {
      showError("Admin email must be @thecozycup.com");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Create admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const uid = userCredential.user.uid;

      // 2️⃣ Save admin to USERS collection
      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        surname,
        email,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Save admin to ADMINS collection ✅
      await setDoc(doc(db, "admins", uid), {
        uid,
        name,
        surname,
        email,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
      });

      showSuccess("Admin created successfully 👑");
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      showError(error.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add New Admin 👑</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Admin name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Surname</Text>
      <TextInput
        style={styles.input}
        placeholder="Admin surname"
        value={surname}
        onChangeText={setSurname}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="admin@thecozycup.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Minimum 6 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleCreateAdmin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Create Admin"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.light,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: colors.light,
    fontWeight: "700",
    fontSize: 16,
  },
});
