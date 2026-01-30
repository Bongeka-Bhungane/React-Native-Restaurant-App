import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { colors } from "../../theme/colors";
import { signOut } from "firebase/auth";

export default function AdminProfileScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.navigate("Login");
      return;
    }
    loadAdminProfile(auth.currentUser.uid);
  }, []);

  const loadAdminProfile = async (uid: string) => {
    try {
      const adminRef = doc(db, "admins", uid);
      const snap = await getDoc(adminRef);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setSurname(data.surname || "");
        setEmail(data.email || "");
      }
    } catch (err) {
      console.log("Error loading admin profile:", err);
    }
  };

  const handleSave = async () => {
    if (!name || !surname || !email) {
      Alert.alert("Incomplete Info", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await setDoc(
        doc(db, "admins", uid),
        {
          name,
          surname,
          email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      Alert.alert("Success", "Profile updated successfully ✅");
    } catch (err) {
      console.log("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.log("Logout error:", err);
      Alert.alert("Error", "Failed to log out");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Profile 👑</Text>

      <Text style={styles.label}>First Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Surname</Text>
      <TextInput
        style={styles.input}
        value={surname}
        onChangeText={setSurname}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "Saving..." : "Save Profile"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: colors.dark,
  },
  input: {
    backgroundColor: colors.light,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: { color: colors.light, fontWeight: "700", fontSize: 16 },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  logoutButtonText: { color: colors.light, fontWeight: "700", fontSize: 16 },
});
