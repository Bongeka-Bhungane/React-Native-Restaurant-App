import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../theme/colors";

type OrderType = "pickup" | "delivery";

interface Order {
  id: string;
  userId: string;
  orderType?: OrderType; // optional in case Firestore data is missing it
  status: string;
  totalAmount: number;
}

interface UserInfo {
  name: string;
  email: string;
}

const STATUS_FLOW: Record<OrderType, string[]> = {
  pickup: ["preparing", "ready", "delivered"],
  delivery: ["preparing", "delivering", "delivered"],
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), async (snap) => {
      const data: Order[] = snap.docs.map((d) => {
        const docData = d.data();
        return {
          id: d.id,
          userId: docData.userId,
          orderType: docData.orderType as OrderType | undefined,
          status: docData.status,
          totalAmount: docData.totalAmount,
        };
      });

      setOrders(data);

      // Fetch user info for each order
      const users: Record<string, UserInfo> = {};
      await Promise.all(
        data.map(async (order) => {
          if (!userMap[order.userId]) {
            const userSnap = await getDoc(doc(db, "users", order.userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              users[order.userId] = {
                name: u.name || "Unknown",
                email: u.email || "Unknown",
              };
            }
          }
        }),
      );

      // Merge newly fetched users into state
      setUserMap((prev) => ({ ...prev, ...users }));
    });

    return unsub;
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: 16,
        backgroundColor: colors.background,
      }}
      renderItem={({ item }) => {
        const user = userMap[item.userId];

        if (!item.orderType || !(item.orderType in STATUS_FLOW)) {
          return (
            <View style={styles.card}>
              <Text style={styles.title}>Order • Unknown Type</Text>
              <Text>Status: {item.status}</Text>
              <Text>Total: R{item.totalAmount}</Text>
              {user && (
                <>
                  <Text>User: {user.name}</Text>
                  <Text>Email: {user.email}</Text>
                </>
              )}
            </View>
          );
        }

        return (
          <View style={styles.card}>
            <Text style={styles.title}>
              Order • {item.orderType.toUpperCase()}
            </Text>
            <Text>Status: {item.status}</Text>
            <Text>Total: R{item.totalAmount}</Text>
            {user && (
              <>
                <Text>User: {user.name}</Text>
                <Text>Email: {user.email}</Text>
              </>
            )}
            <View style={styles.row}>
              {STATUS_FLOW[item.orderType].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.statusBtn}
                  onPress={() => updateStatus(item.id, s)}
                >
                  <Text>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  statusBtn: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 6,
  },
});
