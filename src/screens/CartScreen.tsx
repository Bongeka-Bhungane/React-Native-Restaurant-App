import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { useCart } from "../context/CartContext";

function money(n: number) {
  const v = Number(n || 0);
  return `R ${v.toFixed(2)}`;
}

function sumAddOns(list: Array<{ priceAddOn: number }> | undefined) {
  if (!Array.isArray(list)) return 0;
  return list.reduce((sum, x) => sum + Number(x.priceAddOn || 0), 0);
}

export default function CartScreen({ navigation }: any) {
  const { cart, removeFromCart, clearCart, updateQty, getTotal } = useCart();
  const total = getTotal();

  const renderItem = ({ item }: any) => {
    const sides = item.sidesDetailed ?? [];
    const extras = item.extras ?? [];

    const sidesTotal = sumAddOns(sides);
    const extrasTotal = sumAddOns(extras);

    const hasTemp = !!item.temperature;
    const hasNotes = !!(item.notes && String(item.notes).trim().length > 0);

    return (
      <View style={{ marginBottom: spacing.lg }}>
        <CozyCard>
          <View style={styles.row}>
            <View style={styles.imageWrap}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={{ color: colors.muted, fontWeight: "800" }}>
                    No Image
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>

              {/* Base + unit */}
              <View style={styles.inlineRow}>
                <Text style={styles.smallMuted}>Base:</Text>
                <Text style={styles.smallStrong}>{money(item.basePrice)}</Text>
                <View style={{ width: 10 }} />
                <Text style={styles.smallMuted}>Each:</Text>
                <Text style={styles.smallStrong}>{money(item.unitTotal)}</Text>
              </View>

              {/* Temperature */}
              {hasTemp && (
                <Text style={styles.smallText}>
                  Temperature:{" "}
                  <Text style={styles.smallStrong}>{item.temperature}</Text>
                  {Number(item.temperatureAddOn || 0) > 0 ? (
                    <Text style={styles.smallMuted}>
                      {" "}
                      (+{money(item.temperatureAddOn)})
                    </Text>
                  ) : null}
                </Text>
              )}

              {/* Sides */}
              {Array.isArray(sides) && sides.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.sectionMini}>Sides</Text>
                  {sides.map((s: any) => (
                    <View key={s.name} style={styles.lineItemRow}>
                      <Text style={styles.lineItemLeft}>{s.name}</Text>
                      <Text style={styles.lineItemRight}>
                        + {money(s.priceAddOn)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.lineItemRow}>
                    <Text style={styles.lineItemLeftTotal}>Sides total</Text>
                    <Text style={styles.lineItemRightTotal}>
                      {money(sidesTotal)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Extras */}
              {Array.isArray(extras) && extras.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sectionMini}>Extras</Text>
                  {extras.map((x: any) => (
                    <View key={x.name} style={styles.lineItemRow}>
                      <Text style={styles.lineItemLeft}>{x.name}</Text>
                      <Text style={styles.lineItemRight}>
                        + {money(x.priceAddOn)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.lineItemRow}>
                    <Text style={styles.lineItemLeftTotal}>Extras total</Text>
                    <Text style={styles.lineItemRightTotal}>
                      {money(extrasTotal)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Notes */}
              {hasNotes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}

              <View style={{ height: spacing.md }} />

              {/* Qty + Row total */}
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => updateQty(item.cartId, item.quantity - 1)}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>

                <Text style={styles.qtyValue}>{item.quantity}</Text>

                <Pressable
                  onPress={() => updateQty(item.cartId, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>

                <View style={{ flex: 1 }} />

                <Text style={styles.rowTotal}>{money(item.totalPrice)}</Text>
              </View>

              <View style={{ height: spacing.sm }} />

              <Pressable
                onPress={() => removeFromCart(item.cartId)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </CozyCard>
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>Review your order before checkout</Text>
      </View>

      {cart.length === 0 ? (
        <CozyCard>
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptyText}>
            Add something cozy from the menu ☕
          </Text>

          <View style={{ height: spacing.md }} />

          <CozyButton
            label="Go to Home"
            onPress={() => navigation.navigate("Home")}
          />
        </CozyCard>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(x: any) => x.cartId}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 170 }}
          />

          {/* Sticky footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerLabel}>Total</Text>
                <Text style={styles.footerTotal}>{money(total)}</Text>
              </View>

              <Pressable onPress={clearCart} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            <CozyButton
              label="Proceed to Checkout"
              onPress={() => navigation.navigate("Checkout")}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  row: { flexDirection: "row", gap: spacing.lg },

  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },

  name: { fontSize: 16, fontWeight: "900", color: colors.text },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
    gap: 6,
  },
  smallMuted: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  smallStrong: { color: colors.text, fontWeight: "900", fontSize: 12 },

  sectionMini: {
    marginTop: 2,
    color: colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  lineItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  lineItemLeft: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
    paddingRight: 10,
    flex: 1,
  },
  lineItemRight: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  lineItemLeftTotal: { color: colors.text, fontWeight: "900", fontSize: 12 },
  lineItemRightTotal: { color: colors.text, fontWeight: "900", fontSize: 12 },

  smallText: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  notesBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(107, 74, 58, 0.08)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesTitle: { color: colors.text, fontWeight: "900", fontSize: 12 },
  notesText: {
    marginTop: 4,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  qtyValue: {
    fontWeight: "900",
    color: colors.text,
    width: 24,
    textAlign: "center",
  },

  rowTotal: { fontWeight: "900", color: colors.primary },

  removeBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: "rgba(217, 83, 79, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(217, 83, 79, 0.35)",
  },
  removeText: { color: colors.danger, fontWeight: "900", fontSize: 12 },

  emptyTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  emptyText: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  footer: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  footerLabel: { color: colors.muted, fontWeight: "800" },
  footerTotal: { color: colors.text, fontWeight: "900", fontSize: 18 },

  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
});
