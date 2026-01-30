import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { auth, db } from "../config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

type OrderType = "pickup" | "delivery";

interface UserProfile {
  address?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getTotal, clearCart } = useCart();

  // Order info
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [address, setAddress] = useState("");

  // Card info
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Load user profile from Firebase
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!auth.currentUser) return;

      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        if (data.address) setAddress(data.address);
        if (data.cardName) setCardName(data.cardName);
        if (data.cardNumber) setCardNumber(data.cardNumber);
        if (data.cardExpiry) setCardExpiry(data.cardExpiry);
        if (data.cardCvv) setCardCvv(data.cardCvv);
      }
    };
    loadUserProfile();
  }, []);

  const handlePayment = async () => {
    // Validate required fields
    if (
      !cardName ||
      !cardNumber ||
      !cardExpiry ||
      !cardCvv ||
      (orderType === "delivery" && !address)
    ) {
      Alert.alert("Incomplete Info", "Please complete all required fields.");
      return;
    }

    try {
      if (auth.currentUser) {
        await addDoc(collection(db, "orders"), {
          userId: auth.currentUser.uid,
          items: cart,
          totalAmount: getTotal(),
          orderType,
          address: orderType === "delivery" ? address : null,
          status: "preparing",
          paymentStatus: "paid",
          createdAt: serverTimestamp(),
        });
      }

      clearCart();
      Alert.alert("Success", "Order placed successfully ☕");
      navigation.navigate("HomeTab");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to place order");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Checkout ☕</Text>

      {/* Order Type */}
      <Text style={styles.sectionTitle}>Order Type</Text>
      <View style={styles.row}>
        {(["delivery", "pickup"] as OrderType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.option, orderType === type && styles.active]}
            onPress={() => setOrderType(type)}
          >
            <Text>{type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delivery Address */}
      {orderType === "delivery" && (
        <>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
        </>
      )}

      {/* Order Summary */}
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {cart.length === 0 ? (
        <Text>Your cart is empty</Text>
      ) : (
        cart.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <Text>
              {item.name} x {item.quantity}
            </Text>
            <Text>R{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))
      )}
      <Text style={styles.total}>Total: R{getTotal().toFixed(2)}</Text>

      {/* Card Info */}
      <Text style={styles.sectionTitle}>Card Info</Text>
      <TextInput
        style={styles.input}
        placeholder="Name on Card"
        value={cardName}
        onChangeText={setCardName}
      />
      <TextInput
        style={styles.input}
        placeholder="Card Number"
        keyboardType="numeric"
        value={cardNumber}
        onChangeText={setCardNumber}
      />

      <View style={{ flexDirection: "row" }}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="MM/YY"
          value={cardExpiry}
          onChangeText={setCardExpiry}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="CVV"
          keyboardType="numeric"
          value={cardCvv}
          onChangeText={setCardCvv}
        />
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Pay & Place Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  sectionTitle: { marginTop: 14, fontWeight: "700" },
  row: { flexDirection: "row", marginVertical: 8 },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginRight: 8,
  },
  active: { backgroundColor: colors.primary },
  input: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  total: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  payButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  payButtonText: { color: colors.light, fontWeight: "700" },
});
