// App.tsx
import React from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { CartProvider } from "./src/context/CartContext";
import { PaystackProvider } from "react-native-paystack-webview";

const PUBLIC_PAYSTACK_KEY = "pk_test_bb0e5b870215389df3fd36733dcaf0b1dfc312e7";

export default function App() {
  return (
    <PaystackProvider publicKey={PUBLIC_PAYSTACK_KEY}>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </PaystackProvider>
  );
}
