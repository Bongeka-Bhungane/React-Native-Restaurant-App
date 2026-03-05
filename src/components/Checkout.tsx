import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { usePaystack } from "react-native-paystack-webview";
import { colors } from "../theme/colors";

interface CheckoutProps {
  email: string;
  totalAmount: number; // in Rand
  onSuccess: () => Promise<void>;
}

const Checkout: React.FC<CheckoutProps> = ({
  email,
  totalAmount,
  onSuccess,
}) => {
  const { popup } = usePaystack();

  const handlePay = () => {
    if (!popup?.checkout) {
      Alert.alert(
        "Paystack not ready",
        "Paystack Provider is missing or not initialized.",
      );
      return;
    }

    popup.checkout({
      email,
      amount: Math.round(totalAmount * 100),
      onSuccess: async (res) => {
        console.log("✅ Payment Success:", res);
        try {
          await onSuccess();
          Alert.alert("Payment Successful", "Your order has been placed!");
        } catch (err) {
          console.error("Order save failed:", err);
          Alert.alert("Error", "Payment succeeded but order save failed.");
        }
      },
      onCancel: () => {
        console.log("❌ Payment Cancelled");
        Alert.alert("Payment Cancelled", "Your payment was cancelled.");
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePay}
      activeOpacity={0.9}
    >
      <Text style={styles.buttonText}>Pay Now</Text>
    </TouchableOpacity>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: colors.primary ?? "#6B4A3A",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border ?? "#E7D9CF",
  },
  buttonText: {
    color: colors.white ?? "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
