import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { showSuccess } from "../utils/toast";

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getTotal, clearCart } = useCart();
  const [address, setAddress] = useState(""); // Default: user profile address
  const [cardNumber, setCardNumber] = useState(""); // For demo only

  const handlePlaceOrder = () => {
    if (!address || !cardNumber) {
      alert("Please enter your address and card number");
      return;
    }

    // For demo, just show success
    showSuccess("Order placed successfully! ☕");
    clearCart();
    navigation.navigate("HomeTab");
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>
        {item.name} x {item.quantity}
      </Text>
      {item.side && <Text style={styles.itemOption}>Side: {item.side}</Text>}
      {item.drink && <Text style={styles.itemOption}>Drink: {item.drink}</Text>}
      {item.extras && item.extras.length > 0 && (
        <Text style={styles.itemOption}>Extras: {item.extras.join(", ")}</Text>
      )}
      <Text style={styles.itemPrice}>R{item.price * item.quantity}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <Text style={styles.sectionTitle}>Delivery Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your address"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.sectionTitle}>Payment Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Order Summary</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Text style={styles.total}>Total: R{getTotal()}</Text>

      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
      >
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    color: colors.text,
  },
  itemContainer: {
    padding: 12,
    backgroundColor: colors.light,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemName: { fontSize: 16, fontWeight: "700", color: colors.primary },
  itemOption: { fontSize: 14, color: colors.textSecondary },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
  },
  total: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 12,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  placeOrderText: { color: colors.light, fontSize: 16, fontWeight: "700" },
});
