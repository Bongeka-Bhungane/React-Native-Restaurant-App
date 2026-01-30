import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../theme/colors";

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({
    registeredCustomers: 0,
    registeredAdmins: 0,
    revokedUsers: 0,
    placedOrders: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
    moneyMade: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // ✅ Registered Customers = all users in "users" collection
      const usersRef = collection(db, "users");
      const customersSnap = await getDocs(usersRef);
      const revokedSnap = await getDocs(
        query(usersRef, where("revoked", "==", true)),
      );

      // ✅ Registered Admins = all docs in "admins" collection
      const adminsRef = collection(db, "admins");
      const adminsSnap = await getDocs(adminsRef);

      // ✅ Orders stats
      const ordersRef = collection(db, "orders");
      const ordersSnap = await getDocs(ordersRef);

      let placed = 0,
        delivered = 0,
        canceled = 0,
        money = 0;

      ordersSnap.docs.forEach((doc) => {
        const data = doc.data() as any;
        placed += 1;
        if (data.status === "delivered") delivered += 1;
        if (data.status === "canceled") canceled += 1;
        if (data.paymentStatus === "paid") money += data.totalAmount || 0;
      });

      setStats({
        registeredCustomers: customersSnap.size,
        registeredAdmins: adminsSnap.size,
        revokedUsers: revokedSnap.size,
        placedOrders: placed,
        deliveredOrders: delivered,
        canceledOrders: canceled,
        moneyMade: money,
      });
    } catch (err) {
      console.log("Error fetching stats:", err);
    }
  };

  const renderCard = (
    icon: string,
    title: string,
    value: number | string,
    color?: string,
  ) => (
    <View style={[styles.card, { borderLeftColor: color || colors.primary }]}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <View style={styles.grid}>
        {renderCard(
          "👥",
          "Registered Customers",
          stats.registeredCustomers,
          colors.primary,
        )}
        {renderCard(
          "🛡️",
          "Registered Admins",
          stats.registeredAdmins,
          colors.white,
        )}
        {renderCard("🚫", "Revoked Users", stats.revokedUsers, "red")}
        {renderCard("📦", "Placed Orders", stats.placedOrders, colors.primary)}
        {renderCard("✅", "Delivered Orders", stats.deliveredOrders, "green")}
        {renderCard("❌", "Canceled Orders", stats.canceledOrders, "orange")}
        {renderCard("💰", "Money Made (R)", stats.moneyMade.toFixed(2), "gold")}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: colors.light,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.dark },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
});
