import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { colors } from "../../theme/colors";

export default function AdminLoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.endsWith("@cozycup.com")) {
      Alert.alert("Access Denied", "Admins only");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      const snap = await getDoc(doc(db, "users", userCred.user.uid));

      if (!snap.exists() || snap.data().role !== "admin") {
        await auth.signOut();
        Alert.alert("Access Denied");
        return;
      }

      navigation.replace("AdminDashboard");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Admin Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.light,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: colors.light,
    fontWeight: "700",
    fontSize: 16,
  },
});