import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
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
} from "firebase/firestore";
import { colors } from "../theme/colors";

export default function UserProfileScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [orders, setOrders] = useState<any[]>([]);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) {
        navigation.navigate("Login");
        return;
      }

      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setEmail(data.email || auth.currentUser.email || "");
        setAddress(data.address || "");
        setContactNumber(data.contactNumber || "");
        setCardName(data.cardName || "");
        setCardNumber(data.cardNumber || "");
        setCardExpiry(data.cardExpiry || "");
        setCardCvv(data.cardCvv || "");
      } else {
        setEmail(auth.currentUser.email || "");
      }

      // Load user orders
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
      );
      const querySnap = await getDocs(q);
      const fetchedOrders: any[] = [];
      querySnap.forEach((doc) =>
        fetchedOrders.push({ id: doc.id, ...doc.data() }),
      );
      setOrders(fetchedOrders);
    };

    loadProfile();
  }, []);

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

      alert("Profile updated successfully ☕");
    } catch (error) {
      console.log(error);
      alert("Failed to update profile.");
    }
  };

  const renderOrder = ({ item }: any) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderId}>Order ID: {item.id}</Text>
      <Text>
        Date: {new Date(item.createdAt.seconds * 1000).toLocaleString()}
      </Text>
      <Text>Total: R{item.total}</Text>
      <Text style={styles.orderItems}>Items:</Text>
      {item.items.map((i: any) => (
        <Text key={i.id}>
          - {i.name} x{i.quantity}{" "}
          {i.extras?.length ? `(${i.extras.join(", ")})` : ""}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Profile</Text>

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
  orderId: { fontWeight: "700", color: colors.primary },
  orderItems: { fontWeight: "600", marginTop: 4 },
});
