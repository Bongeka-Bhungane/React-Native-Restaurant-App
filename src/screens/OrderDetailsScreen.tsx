import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyButton from "../components/CozyButton";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { db } from "../config/firebase";

function money(n: any) {
  const v = Number(n || 0);
  return `R ${v.toFixed(2)}`;
}

function formatDate(v: any) {
  try {
    if (!v) return "-";
    const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}

type OrderItem = {
  name?: string;
  quantity?: number;
  unitTotal?: number;
  totalPrice?: number;

  selectedSides?: string[];
  sidesDetailed?: { name: string; priceAddOn: number }[];

  extras?: { name: string; priceAddOn: number }[];
  notes?: string;

  drink?: string;
  drinkAddOn?: number;

  temperature?: string;
  temperatureAddOn?: number;
};

type OrderDoc = {
  orderId: string;
  userId: string;

  email?: string;
  address?: string;

  // ✅ NEW (from checkout screen)
  orderType?: "delivery" | "pickup";

  items?: OrderItem[];

  totalAmount?: number;
  currency?: string;

  status?: string; // preparing, delivering, delivered, ready_for_pickup, picked_up...
  paymentStatus?: string;
  paymentProvider?: string;

  createdAt?: any;
};

function normalizeStatus(s?: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "_");
}

type Step = { key: string; label: string };

function stepsFor(mode: "delivery" | "pickup"): Step[] {
  return mode === "pickup"
    ? [
        { key: "preparing", label: "Preparing" },
        { key: "ready_for_pickup", label: "Ready" },
        { key: "picked_up", label: "Picked up" },
      ]
    : [
        { key: "preparing", label: "Preparing" },
        { key: "delivering", label: "Delivering" },
        { key: "delivered", label: "Delivered" },
      ];
}

function stepIndex(steps: Step[], status?: string) {
  const st = normalizeStatus(status);

  // aliases so tracking still works even if admin uses slightly different words
  const aliasMap: Record<string, string> = {
    in_progress: "preparing",
    out_for_delivery: "delivering",
    shipped: "delivering",
    completed: "delivered",

    ready: "ready_for_pickup",
    pickup_ready: "ready_for_pickup",
    collected: "picked_up",
    pickedup: "picked_up",
    pick_up: "picked_up",
  };

  const normalized = aliasMap[st] ?? st;
  const idx = steps.findIndex((x) => x.key === normalized);
  return idx >= 0 ? idx : 0;
}

function prettifyStatus(s?: string) {
  if (!s) return "";
  return String(s).replace(/_/g, " ");
}

export default function OrderDetailsScreen({ route, navigation }: any) {
  const orderId: string | undefined = route?.params?.orderId;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!orderId) {
        setError("Missing orderId");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const snap = await getDoc(doc(db, "orders", orderId));
        if (!snap.exists()) {
          setError("Order not found.");
          setOrder(null);
          return;
        }

        setOrder(snap.data() as OrderDoc);
      } catch (e: any) {
        setError(e?.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order!.items! : []),
    [order],
  );

  const computedTotal = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((acc, it) => {
      const qty = Number(it?.quantity || 0);
      const unit = Number(it?.unitTotal || 0);
      const rowTotal = Number(it?.totalPrice ?? unit * qty);
      return acc + rowTotal;
    }, 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [items]);

  const total = Number(order?.totalAmount ?? computedTotal);

  // ✅ Read mode from orderType FIRST (fallbacks included)
  const mode: "delivery" | "pickup" = useMemo(() => {
    const t = (order?.orderType || "").toLowerCase().trim();
    if (t === "pickup" || t === "delivery") return t as any;

    // fallback if old orders don't have orderType
    const st = normalizeStatus(order?.status);
    if (
      st.includes("pickup") ||
      st.includes("picked_up") ||
      st.includes("ready_for_pickup")
    ) {
      return "pickup";
    }
    return "delivery";
  }, [order?.orderType, order?.status]);

  const steps = useMemo(() => stepsFor(mode), [mode]);
  const currentIdx = useMemo(
    () => stepIndex(steps, order?.status),
    [steps, order?.status],
  );

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>The Cozy Cup ☕</Text>
        </View>

        {loading ? (
          <CozyCard>
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading order…</Text>
            </View>
          </CozyCard>
        ) : error ? (
          <CozyCard>
            <Text style={styles.errorText}>{error}</Text>
            <View style={{ height: spacing.md }} />
            <CozyButton
              label="Back"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          </CozyCard>
        ) : (
          <>
            {/* ✅ TRACKING UI */}
            <CozyCard>
              <View style={styles.trackHeader}>
                <Text style={styles.sectionTitle}>
                  Tracking • {mode === "pickup" ? "Pickup" : "Delivery"}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {!!order?.status && (
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>
                        {prettifyStatus(order.status)}
                      </Text>
                    </View>
                  )}
                  {!!order?.paymentStatus && (
                    <View style={styles.pillSoft}>
                      <Text style={styles.pillSoftText}>
                        {order.paymentStatus}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressRow}>
                {steps.map((s, idx) => {
                  const done = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <View key={s.key} style={styles.stepWrap}>
                      <View
                        style={[
                          styles.stepCircle,
                          done ? styles.stepCircleOn : styles.stepCircleOff,
                          isCurrent ? styles.stepCircleCurrent : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepNumber,
                            done ? styles.stepNumberOn : styles.stepNumberOff,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.stepLabel,
                          done ? styles.stepLabelOn : styles.stepLabelOff,
                        ]}
                      >
                        {s.label}
                      </Text>

                      {idx < steps.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            idx < currentIdx
                              ? styles.stepLineOn
                              : styles.stepLineOff,
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.muted}>
                {mode === "pickup"
                  ? "Pickup order — we’ll notify you when it’s ready."
                  : "Delivery order — we’ll update the status as it moves."}
              </Text>
            </CozyCard>

            <View style={{ height: spacing.lg }} />

            {/* Summary */}
            <CozyCard>
              <Text style={styles.sectionTitle}>Summary</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Order ID</Text>
                <Text style={styles.value}>{order?.orderId ?? orderId}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{formatDate(order?.createdAt)}</Text>
              </View>

              <View style={{ height: spacing.sm }} />

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{money(total)}</Text>
              </View>
            </CozyCard>

            <View style={{ height: spacing.lg }} />

            {/* ✅ Delivery OR Pickup details */}
            <CozyCard>
              <Text style={styles.sectionTitle}>
                {mode === "pickup" ? "Pickup details" : "Delivery details"}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{order?.email ?? "-"}</Text>
              </View>

              {mode === "delivery" ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>
                    {order?.address?.trim() ? order.address : "-"}
                  </Text>
                </View>
              ) : (
                <View style={styles.row}>
                  <Text style={styles.label}>Collection</Text>
                  <Text style={styles.value}>The Cozy Cup</Text>
                </View>
              )}
            </CozyCard>

            <View style={{ height: spacing.lg }} />

            {/* Items */}
            <CozyCard>
              <Text style={styles.sectionTitle}>Items ({items.length})</Text>

              {items.length === 0 ? (
                <Text style={styles.muted}>No items found on this order.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {items.map((it, idx) => {
                    const qty = Number(it?.quantity || 0);
                    const unit = Number(it?.unitTotal || 0);
                    const rowTotal = Number(it?.totalPrice ?? unit * qty);

                    const sides =
                      Array.isArray(it?.sidesDetailed) &&
                      it.sidesDetailed.length
                        ? it.sidesDetailed.map(
                            (s) => `${s.name} (+${money(s.priceAddOn)})`,
                          )
                        : Array.isArray(it?.selectedSides) &&
                            it.selectedSides.length
                          ? it.selectedSides
                          : [];

                    const extras =
                      Array.isArray(it?.extras) && it.extras.length
                        ? it.extras.map(
                            (e) => `${e.name} (+${money(e.priceAddOn)})`,
                          )
                        : [];

                    const tempInfo = it?.temperature
                      ? `${it.temperature}${
                          Number(it?.temperatureAddOn || 0) > 0
                            ? ` (+${money(it.temperatureAddOn)})`
                            : ""
                        }`
                      : "";

                    const drinkInfo = it?.drink
                      ? `${it.drink}${
                          Number(it?.drinkAddOn || 0) > 0
                            ? ` (+${money(it.drinkAddOn)})`
                            : ""
                        }`
                      : "";

                    return (
                      <View key={`${idx}`} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>
                            {it?.name ?? "Item"}
                          </Text>
                          <Text style={styles.itemMeta}>
                            Qty: {qty} • Unit: {money(unit)}
                          </Text>

                          {!!tempInfo && (
                            <Text style={styles.itemSmall}>
                              Temp: {tempInfo}
                            </Text>
                          )}
                          {!!drinkInfo && (
                            <Text style={styles.itemSmall}>
                              Drink: {drinkInfo}
                            </Text>
                          )}

                          {!!sides.length && (
                            <Text style={styles.itemSmall}>
                              Sides: {sides.join(", ")}
                            </Text>
                          )}
                          {!!extras.length && (
                            <Text style={styles.itemSmall}>
                              Extras: {extras.join(", ")}
                            </Text>
                          )}

                          {!!it?.notes?.trim() && (
                            <Text style={styles.itemSmall}>
                              Notes: {it.notes.trim()}
                            </Text>
                          )}
                        </View>

                        <Text style={styles.itemTotal}>{money(rowTotal)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={{ height: spacing.md }} />
              <CozyButton
                label="Back"
                variant="outline"
                onPress={() => navigation.navigate("Profile")}
              />
            </CozyCard>
          </>
        )}
      </ScrollView>
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
  errorText: { color: (colors as any).danger ?? "crimson", fontWeight: "900" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  label: { color: colors.muted, fontWeight: "800" },
  value: { color: colors.text, fontWeight: "900" },

  totalBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(107, 74, 58, 0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: colors.muted, fontWeight: "900" },
  totalValue: { color: colors.primary, fontWeight: "900", fontSize: 18 },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemName: { fontWeight: "900", color: colors.text, fontSize: 13 },
  itemMeta: { marginTop: 4, color: colors.muted, fontWeight: "700" },
  itemSmall: { marginTop: 6, color: colors.muted, fontWeight: "700" },
  itemTotal: { fontWeight: "900", color: colors.primary, fontSize: 14 },

  // Tracking UI
  trackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  progressRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepWrap: {
    flex: 1,
    alignItems: "center",
  },

  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  stepCircleOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleOff: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  stepCircleCurrent: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  stepNumber: { fontWeight: "900", fontSize: 13 },
  stepNumberOn: { color: colors.white },
  stepNumberOff: { color: colors.primary },

  stepLabel: { marginTop: 8, fontWeight: "800", fontSize: 12 },
  stepLabelOn: { color: colors.text },
  stepLabelOff: { color: colors.muted },

  stepLine: {
    position: "absolute",
    top: 17,
    left: "50%",
    width: "100%",
    height: 3,
    zIndex: -1,
    borderRadius: 999,
  },
  stepLineOn: { backgroundColor: colors.primary },
  stepLineOff: { backgroundColor: colors.border },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  pillSoft: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(200, 155, 110, 0.16)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSoftText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
});
