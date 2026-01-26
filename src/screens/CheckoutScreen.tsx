import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { auth, db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getTotal, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    // Load default address & card from Firebase if user exists
    const loadUserProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = collection(db, "users");
      const snapshot = await docRef.doc(auth.currentUser.uid).get();
      if (snapshot.exists) {
        const data = snapshot.data();
        setAddress(data.address || "");
        setCardName(data.cardName || "");
        setCardNumber(data.cardNumber || "");
        setCardExpiry(data.cardExpiry || "");
        setCardCvv(data.cardCvv || "");
      }
    };
    loadUserProfile();
  }, []);

  const handlePayment = async () => {
    if (!address || !cardName || !cardNumber || !cardExpiry || !cardCvv) {
      Alert.alert("Incomplete Info", "Please complete address & card info.");
      return;
    }

    try {
      // 1️⃣ Simulate payment through PayFast sandbox
      const merchant_id = "10000100";
      const merchant_key = "46f0cd694581a";
      const amount = getTotal().toFixed(2);
      const item_name = encodeURIComponent("Cozy Cup Order");
      const return_url = encodeURIComponent(
        "https://www.payfast.co.za/eng/process",
      );

      const payFastUrl = `https://sandbox.payfast.co.za/eng/process?merchant_id=${merchant_id}&merchant_key=${merchant_key}&amount=${amount}&item_name=${item_name}&return_url=${return_url}`;

      await Linking.openURL(payFastUrl);

      // 2️⃣ Save order in Firebase
      if (auth.currentUser) {
        const order = {
          userId: auth.currentUser.uid,
          items: cart,
          totalAmount: getTotal(),
          address,
          cardInfo: "**** **** **** " + cardNumber.slice(-4),
          paymentStatus: "paid", // ideally verify via PayFast IPN
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "orders"), order);
      }

      // 3️⃣ Clear cart & navigate
      clearCart();
      Alert.alert("Success", "Order placed successfully ☕");
      navigation.navigate("HomeTab");
    } catch (error) {
      console.log(error);
      Alert.alert("Payment Error", "Could not process payment.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Checkout ☕</Text>

      <Text style={styles.sectionTitle}>Delivery Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

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

      <Text style={styles.sectionTitle}>Order Summary</Text>
      {cart.map((item) => (
        <View key={item.id} style={styles.summaryItem}>
          <Text style={styles.summaryName}>
            {item.name} x {item.quantity}
          </Text>
          <Text style={styles.summaryPrice}>
            R{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
      <Text style={styles.total}>Total: R{getTotal().toFixed(2)}</Text>

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Pay & Place Order ☕</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
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
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryName: { fontSize: 16, color: colors.dark },
  summaryPrice: { fontSize: 16, fontWeight: "600", color: colors.primary },
  total: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 12,
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  payButtonText: { color: colors.light, fontWeight: "700", fontSize: 16 },
});
