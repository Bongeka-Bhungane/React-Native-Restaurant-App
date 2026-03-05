import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import CozyInput from "../components/CozyInput";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import PriceBar from "../components/PriceBar";

import { useCart } from "../context/CartContext";

type Option = { name: string; priceAddOn?: number };

type SideOption = { name: string; priceAddOn: number };

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // base price
  image?: string;
  category?: string; // "Beverages" etc
  subCategory?: string; // "Coffee" | "Tea" | ...
  customization?: {
    sides?: SideOption[]; // priced sides (add-on)
    extras?: Option[]; // add-on
    maxSides?: number; // default 2
    icedFee?: number; // optional fee for iced
  };
};

function money(n: number) {
  const v = Number(n || 0);
  return `R ${v.toFixed(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isBeverage(item: MenuItem) {
  return (item.category ?? "").toLowerCase() === "beverages";
}

function isHotBeverage(item: MenuItem) {
  const sc = (item.subCategory ?? "").toLowerCase();
  // adjust if your subCategory values differ
  return isBeverage(item) && (sc === "coffee" || sc === "tea");
}

export default function ViewItemScreen({ route, navigation }: any) {
  const { addToCart } = useCart();

  const item: MenuItem | undefined = route?.params?.item;

  if (!item) {
    return (
      <Screen>
        <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>
          Item not found
        </Text>
      </Screen>
    );
  }

  // ✅ Default priced sides (your request)
  const sides: SideOption[] = item.customization?.sides ?? [
    { name: "Chips", priceAddOn: 20 },
    { name: "Salad", priceAddOn: 25 },
    { name: "Pap", priceAddOn: 15 },
  ];

  const extras: Option[] = item.customization?.extras ?? [
    { name: "Extra sauce", priceAddOn: 5 },
    { name: "Extra chips", priceAddOn: 20 },
    { name: "Extra cheese", priceAddOn: 10 },
  ];

  const maxSides = item.customization?.maxSides ?? 2;

  // Iced option fee (optional)
  const icedFee = Number(item.customization?.icedFee ?? 5); // you can change to 0 if free

  const [qty, setQty] = useState(1);

  const [selectedSides, setSelectedSides] = useState<SideOption[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Option[]>([]);

  // ✅ Hot beverage iced toggle
  const [temp, setTemp] = useState<"Hot" | "Iced">("Hot");

  // ✅ Notes instead of removing ingredients
  const [notes, setNotes] = useState("");

  const sidesTotal = useMemo(() => {
    return selectedSides.reduce((sum, s) => sum + Number(s.priceAddOn || 0), 0);
  }, [selectedSides]);

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce(
      (sum, x) => sum + Number(x.priceAddOn || 0),
      0,
    );
  }, [selectedExtras]);

  const tempAddOn = useMemo(() => {
    if (!isHotBeverage(item)) return 0;
    return temp === "Iced" ? icedFee : 0;
  }, [item, temp, icedFee]);

  const singleItemTotal = useMemo(() => {
    return Number(item.price || 0) + sidesTotal + extrasTotal + tempAddOn;
  }, [item.price, sidesTotal, extrasTotal, tempAddOn]);

  const total = useMemo(() => singleItemTotal * qty, [singleItemTotal, qty]);

  const toggleSide = (side: SideOption) => {
    setSelectedSides((prev) => {
      const exists = prev.some((s) => s.name === side.name);
      if (exists) return prev.filter((s) => s.name !== side.name);

      if (prev.length >= maxSides) {
        Alert.alert(
          "Sides limit",
          `You can select up to ${maxSides} side${maxSides > 1 ? "s" : ""}.`,
        );
        return prev;
      }
      return [...prev, side];
    });
  };

  const toggleExtra = (opt: Option) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((x) => x.name === opt.name);
      if (exists) return prev.filter((x) => x.name !== opt.name);
      return [...prev, opt];
    });
  };

  const addToCartNow = () => {
    const cartItem = {
      cartId: `${item.id}_${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      image: item.image ?? "",
      basePrice: Number(item.price || 0),
      quantity: qty,

      sidesDetailed: selectedSides.map((s) => ({
        name: s.name,
        priceAddOn: Number(s.priceAddOn || 0),
      })),

      extras: selectedExtras.map((x) => ({
        name: x.name,
        priceAddOn: Number(x.priceAddOn || 0),
      })),

      temperature: isHotBeverage(item) ? temp : undefined,
      temperatureAddOn: isHotBeverage(item) && temp === "Iced" ? icedFee : 0,

      notes: notes.trim(),

      unitTotal: singleItemTotal,
      totalPrice: total,
    };

    addToCart(cartItem);

    // ✅ Reset after adding (so next add starts clean)
    setSelectedExtras([]);
    setSelectedSides([]);
    setNotes("");
    setQty(1);
    setTemp("Hot");

    Alert.alert("Added to cart ✅", "What would you like to do next?", [
      {
        text: "Continue shopping",
        style: "cancel",
        onPress: () => {
          // stay on this screen
        },
      },
      {
        text: "View cart",
        onPress: () => navigation.navigate("Cart"),
      },
    ]);
  };


  return (
    <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.hero}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.heroImg} />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={{ color: colors.muted, fontWeight: "900" }}>
                No Image
              </Text>
            </View>
          )}

          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.desc}>{item.description}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.price}>{money(item.price)}</Text>

            {!!item.category && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.category}</Text>
              </View>
            )}

            {!!item.subCategory && (
              <View style={styles.pillSoft}>
                <Text style={styles.pillTextSoft}>{item.subCategory}</Text>
              </View>
            )}
          </View>

          <View style={{ height: spacing.lg }} />

          {/* Quantity */}
          <CozyCard>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => setQty((q) => clamp(q - 1, 1, 99))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>

              <Text style={styles.qtyValue}>{qty}</Text>

              <Pressable
                onPress={() => setQty((q) => clamp(q + 1, 1, 99))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>＋</Text>
              </Pressable>
            </View>
          </CozyCard>

          <View style={{ height: spacing.lg }} />

          {/* ✅ Hot/Iced toggle only for hot beverages */}
          {isHotBeverage(item) && (
            <>
              <CozyCard>
                <Text style={styles.sectionTitle}>Temperature</Text>

                <View style={styles.toggleRow}>
                  <Pressable
                    onPress={() => setTemp("Hot")}
                    style={[
                      styles.toggleBtn,
                      temp === "Hot"
                        ? styles.toggleActive
                        : styles.toggleInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        temp === "Hot"
                          ? styles.toggleTextActive
                          : styles.toggleTextInactive,
                      ]}
                    >
                      Hot
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTemp("Iced")}
                    style={[
                      styles.toggleBtn,
                      temp === "Iced"
                        ? styles.toggleActive
                        : styles.toggleInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        temp === "Iced"
                          ? styles.toggleTextActive
                          : styles.toggleTextInactive,
                      ]}
                    >
                      Iced {icedFee > 0 ? `(+${money(icedFee)})` : ""}
                    </Text>
                  </Pressable>
                </View>

                {temp === "Iced" && icedFee > 0 && (
                  <Text style={styles.muted}>Iced fee added to total.</Text>
                )}
              </CozyCard>

              <View style={{ height: spacing.lg }} />
            </>
          )}

          {/* ✅ Sides section shown for non-beverages */}
          {!isBeverage(item) && (
            <>
              <CozyCard>
                <Text style={styles.sectionTitle}>
                  Choose sides (up to {maxSides})
                </Text>

                <View style={{ gap: 10, marginTop: spacing.md }}>
                  {sides.map((s) => {
                    const selected = selectedSides.some(
                      (x) => x.name === s.name,
                    );
                    return (
                      <Pressable
                        key={s.name}
                        onPress={() => toggleSide(s)}
                        style={[
                          styles.checkRow,
                          selected ? styles.checkOn : styles.checkOff,
                        ]}
                      >
                        <View
                          style={[
                            styles.checkBox,
                            selected && styles.checkBoxOn,
                          ]}
                        >
                          {selected && <Text style={styles.checkMark}>✓</Text>}
                        </View>

                        <Text style={styles.checkText}>{s.name}</Text>

                        <Text style={styles.checkPrice}>
                          + {money(s.priceAddOn)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ height: spacing.sm }} />
                <Text style={styles.muted}>
                  Sides total:{" "}
                  <Text style={{ fontWeight: "900", color: colors.primary }}>
                    {money(sidesTotal)}
                  </Text>
                </Text>
              </CozyCard>

              <View style={{ height: spacing.lg }} />
            </>
          )}

          {/* Extras */}
          <CozyCard>
            <Text style={styles.sectionTitle}>Extras (adds to total)</Text>

            <View style={{ gap: 10, marginTop: spacing.md }}>
              {extras.map((ex) => {
                const selected = selectedExtras.some((x) => x.name === ex.name);
                const addOn = Number(ex.priceAddOn || 0);

                return (
                  <Pressable
                    key={ex.name}
                    onPress={() => toggleExtra(ex)}
                    style={[
                      styles.checkRow,
                      selected ? styles.checkOn : styles.checkOff,
                    ]}
                  >
                    <View
                      style={[styles.checkBox, selected && styles.checkBoxOn]}
                    >
                      {selected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={styles.checkText}>{ex.name}</Text>
                    <Text style={styles.checkPrice}>+ {money(addOn)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: spacing.sm }} />
            <Text style={styles.muted}>
              Extras total:{" "}
              <Text style={{ fontWeight: "900", color: colors.primary }}>
                {money(extrasTotal)}
              </Text>
            </Text>
          </CozyCard>

          <View style={{ height: spacing.lg }} />

          {/* ✅ Notes */}
          <CozyCard>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <View style={{ height: spacing.sm }} />
            <CozyInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. No sugar, extra napkins, well done..."
            />
          </CozyCard>

          <View style={{ height: spacing.xl }} />

          <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>

      <PriceBar
        totalLabel={`Total (${qty} item${qty > 1 ? "s" : ""})`}
        totalValue={money(total)}
        buttonLabel="Add to cart"
        onPress={addToCartNow}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroImg: { width: "100%", height: "100%" },
  heroFallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 20, fontWeight: "900", color: colors.primary },

  name: { fontSize: 22, fontWeight: "900", color: colors.text },
  desc: {
    marginTop: 8,
    color: colors.muted,
    fontWeight: "600",
    lineHeight: 18,
  },

  metaRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  price: { fontSize: 18, fontWeight: "900", color: colors.primary },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  pillSoft: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(200, 155, 110, 0.16)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillTextSoft: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  sectionTitle: { fontSize: 15, fontWeight: "900", color: colors.text },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  qtyBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { color: colors.white, fontWeight: "900", fontSize: 20 },
  qtyValue: { fontSize: 18, fontWeight: "900", color: colors.text },

  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(107, 74, 58, 0.08)",
    borderRadius: radius.xl,
    padding: 6,
    gap: 6,
    marginTop: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleInactive: { backgroundColor: "transparent" },
  toggleText: { fontSize: 12, fontWeight: "900" },
  toggleTextActive: { color: colors.white },
  toggleTextInactive: { color: colors.primary },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  checkOn: { borderColor: colors.primary },
  checkOff: {},
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: { backgroundColor: colors.primary },
  checkMark: { color: colors.white, fontWeight: "900" },
  checkText: { flex: 1, color: colors.text, fontWeight: "800" },
  checkPrice: { color: colors.primary, fontWeight: "900" },

  muted: { color: colors.muted, fontWeight: "700", marginTop: 8 },
});
