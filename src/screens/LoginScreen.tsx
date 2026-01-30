import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { colors } from "../theme/colors";
import { showSuccess, showError } from "../utils/toast";

type Role = "customer" | "admin";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [revoked, setRevoked] = useState(false);

  const handleLogin = async () => {
    try {
      setRevoked(false);

      // 1️⃣ Firebase Auth login
      const res = await signInWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      // 2️⃣ Fetch profiles
      const userSnap = await getDoc(doc(db, "users", uid));
      const adminSnap = await getDoc(doc(db, "admins", uid));

      let profile: any = null;
      let profileRole: Role | null = null;

      if (userSnap.exists()) {
        profile = userSnap.data();
        profileRole = "customer";
      }

      if (adminSnap.exists()) {
        profile = adminSnap.data();
        profileRole = "admin";
      }

      // 3️⃣ Profile existence check
      if (!profile) {
        await signOut(auth);
        showError("Account profile not found");
        return;
      }

      // 4️⃣ Revoked account check 🔒
      if (profile.isActive === false) {
        await signOut(auth);
        setRevoked(true);
        return;
      }

      // 5️⃣ Role validation
      if (role !== profileRole) {
        await signOut(auth);
        showError(
          role === "admin" ? "Admin access denied" : "Customer access denied",
        );
        return;
      }

      // 6️⃣ Navigate
      if (role === "admin") {
        showSuccess("Welcome Admin ☕");
        navigation.replace("AdminApp");
      } else {
        showSuccess("Logged in successfully ☕");
        navigation.replace("App", { screen: "HomeTab" });
      }
    } catch (error) {
      console.log(error);
      showError("Invalid login details");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back ☕</Text>

      {/* 🚨 Revoked Alert */}
      {revoked && (
        <View style={styles.revokedBox}>
          <Text style={styles.revokedText}>
            ⚠️ This account has been revoked. Please contact support.
          </Text>
          <TouchableOpacity
            style={styles.revokedButton}
            onPress={() => navigation.navigate("Contact")}
          >
            <Text style={styles.revokedButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Role Selector */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "customer" && styles.roleActive]}
          onPress={() => setRole("customer")}
        >
          <Text style={styles.roleText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "admin" && styles.roleActive]}
          onPress={() => setRole("admin")}
        >
          <Text style={styles.roleText}>Admin</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setRevoked(false);
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setRevoked(false);
        }}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          Login as {role === "admin" ? "Admin" : "Customer"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Create a new account</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },

  revokedBox: {
    backgroundColor: "#FDECEA",
    borderColor: "#F5C2C7",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  revokedText: {
    color: "#B42318",
    fontWeight: "600",
    textAlign: "center",
  },

  input: {
    backgroundColor: colors.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    color: colors.text,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: colors.light,
    fontWeight: "600",
    fontSize: 16,
  },

  link: {
    color: colors.accent,
    textAlign: "center",
    marginTop: 16,
  },

  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginHorizontal: 4,
  },

  roleActive: {
    backgroundColor: colors.primary,
  },

  roleText: {
    color: colors.text,
    fontWeight: "600",
  },
  revokedButton: {  
    marginTop: 10,
    backgroundColor: colors.danger,
    padding: 10,  
    borderRadius: 8,
  },
  revokedButtonText: {
    color: colors.white,
    fontWeight: "700",
    textAlign: "center",
  }
});
