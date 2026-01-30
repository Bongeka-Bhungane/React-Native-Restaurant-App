import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../theme/colors";

type UserItem = {
  uid: string;
  name: string;
  surname: string;
  email: string;
  role: "admin" | "customer";
  isActive?: boolean;
};

export default function AdminUsersScreen() {
  const [view, setView] = useState<"admins" | "customers">("customers");
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const col =
      view === "admins"
        ? collection(db, "admins")
        : collection(db, "users");

    const q = query(col);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserItem[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();

        // Skip admins from users list
        if (view === "customers" && d.role === "admin") return;

        list.push({
          uid: docSnap.id,
          ...d,
          isActive: d.isActive ?? true,
        } as UserItem);
      });

      setData(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [view]);

  const toggleStatus = async (user: UserItem) => {
    Alert.alert(
      user.isActive ? "Revoke Access" : "Restore Access",
      `Are you sure you want to ${
        user.isActive ? "disable" : "enable"
      } this ${view === "admins" ? "admin" : "user"}?`,
      [
        { text: "Cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            const ref =
              view === "admins"
                ? doc(db, "admins", user.uid)
                : doc(db, "users", user.uid);

            await updateDoc(ref, {
              isActive: !user.isActive,
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: UserItem }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>
          {item.name} {item.surname}
        </Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text
          style={[
            styles.status,
            { color: item.isActive ? colors.success : colors.danger },
          ]}
        >
          {item.isActive ? "Active" : "Revoked"}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: item.isActive ? colors.danger : colors.success },
        ]}
        onPress={() => toggleStatus(item)}
      >
        <Text style={styles.actionText}>
          {item.isActive ? "Revoke" : "Restore"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>User Management 👥</Text>

      {/* TOGGLE */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === "customers" && styles.activeToggle,
          ]}
          onPress={() => setView("customers")}
        >
          <Text
            style={[
              styles.toggleText,
              view === "customers" && styles.activeToggleText,
            ]}
          >
            Customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === "admins" && styles.activeToggle,
          ]}
          onPress={() => setView("admins")}
        >
          <Text
            style={[
              styles.toggleText,
              view === "admins" && styles.activeToggleText,
            ]}
          >
            Admins
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No {view === "admins" ? "admins" : "users"} found
          </Text>
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: colors.light,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontWeight: "700",
    color: colors.text,
  },
  activeToggleText: {
    color: colors.light,
  },

  card: {
    backgroundColor: colors.light,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  status: {
    marginTop: 4,
    fontWeight: "700",
  },

  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionText: {
    color: colors.light,
    fontWeight: "700",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: colors.textSecondary,
  },
});
