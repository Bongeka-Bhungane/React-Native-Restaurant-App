import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { auth, db } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { colors } from "../theme/colors";
import { startPayFastPayment } from "../utils/payfast";

interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: any;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  items: OrderItem[];
}

export default function UserProfileScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigation.navigate("Login");
        return;
      }
      loadProfile(user.uid);
    });
    return unsubscribe;
  }, []);

  const loadProfile = async (uid: string) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setName(data.name || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setContactNumber(data.contactNumber || "");
      setCardName(data.cardName || "");
      setCardNumber(data.cardNumber || "");
      setCardExpiry(data.cardExpiry || "");
      setCardCvv(data.cardCvv || "");
    }

    await fetchOrders(uid);
  };

  const fetchOrders = async (uid: string) => {
    try {
      const ordersRef = collection(db, "orders");

      // Remove orderBy if some orders don't have createdAt
      const q = query(ordersRef, where("userId", "==", uid));

      const snap = await getDocs(q);

      const fetchedOrders: Order[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          createdAt: data.createdAt || serverTimestamp(), // fallback
          totalAmount: data.totalAmount || 0,
          paymentStatus: data.paymentStatus || "unpaid",
          status: data.status || "preparing",
          items: data.items || [],
        };
      });

      // Sort client-side by createdAt
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setOrders(fetchedOrders);
    } catch (err) {
      console.log("Error fetching orders:", err);
    }
  };


  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          name,
          email,
          address,
          contactNumber,
          cardName,
          cardNumber,
          cardExpiry,
          cardCvv,
        },
        { merge: true },
      );
      Alert.alert("Success", "Profile updated successfully ☕");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handlePayOrder = async (order: any) => {
    try {
      await startPayFastPayment({
        amount: order.totalAmount,
        orderId: order.id,
      });

      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        paymentStatus: "paid",
        paidAt: serverTimestamp(),
      });

      Alert.alert("Payment Successful", "Your order has been paid.");
      if (auth.currentUser) {
        fetchOrders(auth.currentUser.uid);
      }
    } catch (error) {
      Alert.alert("Payment Error", "Payment could not be completed.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "red";
      case "delivering":
        return "yellow";
      case "delivered":
        return "green";
      default:
        return colors.text;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderDate}>
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString()
          : new Date().toLocaleString()}
      </Text>
      <Text>Total: R{item.totalAmount.toFixed(2)}</Text>
      <Text style={{ color: getStatusColor(item.status), fontWeight: "700" }}>
        Status: {item.status.toUpperCase()}
      </Text>
      <Text>Payment: {item.paymentStatus.toUpperCase()}</Text>
      <Text style={{ marginTop: 6, fontWeight: "700" }}>Items:</Text>
      {item.items.map((i) => (
        <Text key={i.id}>
          • {i.name} ({i.category}) x{i.quantity}
        </Text>
      ))}

      {item.paymentStatus !== "paid" && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handlePayOrder(item)}
        >
          <Text style={styles.payButtonText}>Pay Now (PayFast)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Profile</Text>

      {/* Profile Fields */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Card Name</Text>
      <TextInput
        style={styles.input}
        value={cardName}
        onChangeText={setCardName}
      />

      <Text style={styles.label}>Card Number</Text>
      <TextInput
        style={styles.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="numeric"
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="MM/YY"
          value={cardExpiry}
          onChangeText={setCardExpiry}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="CVV"
          value={cardCvv}
          onChangeText={setCardCvv}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>

      {/* Orders Section */}
      <Text style={[styles.header, { marginTop: 24 }]}>My Orders</Text>
      {orders.length === 0 ? (
        <Text style={{ textAlign: "center", marginVertical: 12 }}>
          No orders yet ☕
        </Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: colors.dark,
  },
  input: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
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
  orderCard: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  orderDate: { fontWeight: "600", marginBottom: 6 },
  payButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  payButtonText: { color: colors.light, fontWeight: "700" },
});
