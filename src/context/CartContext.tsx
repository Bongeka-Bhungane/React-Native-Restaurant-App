import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";

export type CartAddOn = {
  name: string;
  priceAddOn: number;
};

export type CartSide = {
  name: string;
  priceAddOn: number;
};

export type CartItem = {
  cartId: string;
  menuItemId: string;

  name: string;
  image?: string;

  basePrice: number;
  quantity: number;

  // ✅ new: sides with prices
  sidesDetailed?: CartSide[];

  // ✅ extras with prices
  extras: CartAddOn[];

  // ✅ new: hot/iced for hot beverages
  temperature?: "Hot" | "Iced";
  temperatureAddOn?: number;

  // ✅ new: notes
  notes?: string;

  unitTotal: number; // price of 1 configured item (base + add-ons)
  totalPrice: number; // unitTotal * quantity
};

type CartContextValue = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  updateQty: (cartId: string, qty: number) => void;
  getTotal: () => number;
};

const CartContext = createContext<CartContextValue | null>(null);

function recalcRow(item: CartItem, qty: number): CartItem {
  const safeQty = Math.max(1, Math.min(99, qty));
  return {
    ...item,
    quantity: safeQty,
    totalPrice: Number(item.unitTotal || 0) * safeQty,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [item, ...prev]);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((x) => x.cartId !== cartId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    Alert.alert("Clear cart?", "Remove all items from the cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setCart([]) },
    ]);
  };

  const updateQty = (cartId: string, qty: number) => {
    setCart((prev) =>
      prev.map((x) => (x.cartId === cartId ? recalcRow(x, qty) : x)),
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, x) => sum + Number(x.totalPrice || 0), 0);
  };

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      updateQty,
      getTotal,
    }),
    [cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
