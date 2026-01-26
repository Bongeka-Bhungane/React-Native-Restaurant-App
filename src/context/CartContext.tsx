import React, { createContext, useContext, useState, ReactNode } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  extras?: string[];
  side?: string | null;
  drink?: string | null;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  getTotal: () => number;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    // Check if item already exists (same id + same extras, side, drink)
    const existingIndex = cart.findIndex(
      (c) =>
        c.id === item.id &&
        JSON.stringify(c.extras) === JSON.stringify(item.extras) &&
        c.side === item.side &&
        c.drink === item.drink,
    );

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += item.quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (id: string, quantity: number) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(quantity, 1) } : item,
      ),
    );
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
