import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { showError } from "../utils/toast";
import RootNavigator from "../navigation/RootNavigator";

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = firebaseUser.uid;

      // 🔥 listen to BOTH users & admins
      const userRef = doc(db, "users", uid);
      const adminRef = doc(db, "admins", uid);

      let unsubscribeProfile: any;

      unsubscribeProfile = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) return;

          if (snap.data().isActive === false) {
            signOut(auth);
            showError("Your account has been revoked");
          }
        },
        () => {},
      );

      // Admin listener (fallback)
      onSnapshot(adminRef, (snap) => {
        if (!snap.exists()) return;

        if (snap.data().isActive === false) {
          signOut(auth);
          showError("Your admin access has been revoked");
        }
      });

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator />;
}
