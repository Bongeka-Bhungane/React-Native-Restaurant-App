// src/screens/CheckoutScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyInput from "../components/CozyInput";
import CozyButton from "../components/CozyButton";
import Checkout from "../components/Checkout";

import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";

import { auth, db } from "../config/firebase";
import { useCart } from "../context/CartContext";

function money(n: number) {
  return `R ${Number(n || 0).toFixed(2)}`;
}
function safeStr(v: any, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type OrderType = "delivery" | "pickup";

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getTotal, clearCart } = useCart();
  const user = auth.currentUser;

  const total = getTotal();
  const itemCount = useMemo(
    () => cart.reduce((sum, x: any) => sum + safeNum(x.quantity || 0), 0),
    [cart],
  );

  // ✅ NEW: delivery vs pickup
  const [orderType, setOrderType] = useState<OrderType>("delivery");

  const [address, setAddress] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoadingProfile(true);
        const snap = await getDoc(doc(db, "users", user.uid));
        const addr = snap.exists() ? (snap.data()?.address as string) : "";
        if (addr) setAddress(String(addr));
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  const handleSuccessfulPayment = async () => {
    if (!user) return;

    if (cart.length === 0) {
      Alert.alert("Cart empty", "Add items to cart before checkout.");
      return;
    }

    // ✅ Address only required for delivery
    if (orderType === "delivery" && address.trim().length < 5) {
      Alert.alert("Missing address", "Please enter your delivery address.");
      return;
    }

    try {
      setSaving(true);

      const orderId = `order_${Date.now()}`;

      const safeItems = cart.map((x: any) => ({
        cartId: safeStr(x.cartId),
        menuItemId: safeStr(x.menuItemId),
        name: safeStr(x.name),
        image: safeStr(x.image),

        basePrice: safeNum(x.basePrice),
        quantity: safeNum(x.quantity, 1),

        sidesDetailed: Array.isArray(x.sidesDetailed)
          ? x.sidesDetailed.map((s: any) => ({
              name: safeStr(s?.name),
              priceAddOn: safeNum(s?.priceAddOn),
            }))
          : [],

        extras: Array.isArray(x.extras)
          ? x.extras.map((e: any) => ({
              name: safeStr(e?.name),
              priceAddOn: safeNum(e?.priceAddOn),
            }))
          : [],

        temperature: x.temperature ?? null,
        temperatureAddOn: safeNum(x.temperatureAddOn),

        notes: safeStr(x.notes).trim(),

        unitTotal: safeNum(x.unitTotal),
        totalPrice: safeNum(x.totalPrice),
      }));

      await setDoc(doc(db, "orders", orderId), {
        orderId,
        userId: user.uid,
        email: user.email,

        // ✅ NEW
        orderType, // "delivery" | "pickup"
        address: orderType === "delivery" ? address.trim() : "",

        items: safeItems,
        totalAmount: safeNum(total),
        currency: "ZAR",
        paymentProvider: "paystack",
        paymentStatus: "paid",

        // ✅ same status for both; admin can change later
        status: "preparing",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearCart();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err: any) {
      console.error("Order save failed:", err);
      Alert.alert("Error", err?.message || "Could not save order.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <CozyCard>
          <Text style={{ color: colors.muted, fontWeight: "700" }}>
            Please login to checkout.
          </Text>
          <View style={{ height: spacing.md }} />
          <CozyButton
            label="Go to Login"
            onPress={() => navigation.navigate("Login")}
          />
        </CozyCard>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Checkout</Text>
            <Text style={styles.subtitle}>Confirm details & pay</Text>
          </View>

          <CozyCard>
            {/* ✅ NEW: Delivery / Pickup toggle */}
            <Text style={styles.sectionTitle}>Order type</Text>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setOrderType("delivery")}
                style={[
                  styles.toggleBtn,
                  orderType === "delivery"
                    ? styles.toggleActive
                    : styles.toggleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    orderType === "delivery"
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive,
                  ]}
                >
                  Delivery
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setOrderType("pickup")}
                style={[
                  styles.toggleBtn,
                  orderType === "pickup"
                    ? styles.toggleActive
                    : styles.toggleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    orderType === "pickup"
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive,
                  ]}
                >
                  Pickup
                </Text>
              </Pressable>
            </View>

            <Text style={styles.muted}>
              {orderType === "pickup"
                ? "Pickup: you’ll collect at The Cozy Cup."
                : "Delivery: enter your drop-off address."}
            </Text>

            <View style={{ height: spacing.lg }} />

            <Text style={styles.sectionTitle}>
              {orderType === "pickup" ? "Customer details" : "Delivery details"}
            </Text>

            <CozyInput
              label="Email"
              value={user?.email || ""}
              editable={false}
            />

            {/* ✅ Address only when delivery */}
            {orderType === "delivery" && (
              <>
                <CozyInput
                  label="Address"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter delivery address"
                />
                {loadingProfile && (
                  <Text style={styles.muted}>Loading saved address…</Text>
                )}
              </>
            )}

            <View style={{ height: spacing.lg }} />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Order summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{itemCount}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryTotal}>{money(total)}</Text>
              </View>
            </View>

            <View style={{ height: spacing.lg }} />

            {/* ✅ Paystack button */}
            <Checkout
              email={user?.email || "customer@example.com"}
              totalAmount={total}
              onSuccess={handleSuccessfulPayment}
            />

            <CozyButton
              label="Back to Cart"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={saving}
            />
          </CozyCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  muted: { color: colors.muted, fontWeight: "700", marginTop: 8 },

  summaryBox: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(107, 74, 58, 0.06)",
  },
  summaryTitle: { fontWeight: "900", color: colors.text, marginBottom: 10 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryLabel: { color: colors.muted, fontWeight: "800" },
  summaryValue: { color: colors.text, fontWeight: "900" },
  summaryTotal: { color: colors.primary, fontWeight: "900", fontSize: 18 },

  // ✅ Toggle styling (matches your theme style)
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(107, 74, 58, 0.08)",
    borderRadius: radius.xl,
    padding: 6,
    gap: 6,
    marginTop: 6,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleInactive: {
    backgroundColor: "transparent",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "900",
  },
  toggleTextActive: {
    color: colors.white,
  },
  toggleTextInactive: {
    color: colors.primary,
  },
});
