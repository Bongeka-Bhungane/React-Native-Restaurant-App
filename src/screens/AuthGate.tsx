import * as React from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";
import { colors } from "../theme/colors";

export default function AuthGate({ navigation }: any) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data()?.role : "user";

        navigation.reset({
          index: 0,
          routes: [{ name: role === "admin" ? "AdminTabs" : "UserTabs" }],
        });
      } catch (e) {
        // If Firestore denied or doc missing, fallback to user tabs
        navigation.reset({ index: 0, routes: [{ name: "UserTabs" }] });
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
