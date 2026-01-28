import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { colors } from "../theme/colors";
import { showSuccess, showError } from "../utils/toast";

type Role = "customer" | "admin";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");

  const handleLogin = async () => {
    try {
      // 1️⃣ Auth login
      const res = await signInWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      // 2️⃣ Fetch user role
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        showError("User profile not found");
        return;
      }

      const userRole = userSnap.data().role;

      // 3️⃣ Role validation
      if (role === "admin") {
        if (userRole !== "admin") {
          showError("Admin access denied");
          return;
        }

        showSuccess("Welcome Admin ☕");
        navigation.replace("AdminApp"); // Admin Tabs
        return;
      }

      // Customer flow
      showSuccess("Logged in successfully ☕");
      navigation.replace("App", { screen: "HomeTab" });
    } catch (error) {
      console.log(error);
      showError("Invalid login details");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back ☕</Text>

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
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
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
    marginBottom: 24,
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
  buttonText: { color: colors.light, fontWeight: "600", fontSize: 16 },
  link: { color: colors.accent, textAlign: "center", marginTop: 16 },
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
    color: colors.light,
  },

  roleText: {
    color: colors.text,
    fontWeight: "600",
  },
});
