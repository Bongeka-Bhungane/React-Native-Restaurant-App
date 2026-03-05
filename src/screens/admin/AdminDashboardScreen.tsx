// src/screens/admin/AdminDashboardScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { collection, onSnapshot, query } from "firebase/firestore";
import { PieChart } from "react-native-chart-kit";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { db } from "../../config/firebase";

type OrderStatus =
  | "Preparing"
  | "Delivering"
  | "Delivered"
  | "Ready for Pickup"
  | string;

type OrderItem = {
  name?: string;
  quantity?: number;
  totalPrice?: number;
};

type OrderDoc = {
  total?: number;
  totalAmount?: number;
  status?: OrderStatus;
  createdAt?: any;
  items?: OrderItem[];
};

function toDateSafe(ts: any): Date | null {
  try {
    if (!ts) return null;
    if (typeof ts.toDate === "function") return ts.toDate();
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function money(v: number) {
  const n = Number(v || 0);
  return `R ${n.toFixed(2)}`;
}

function normalizeStatus(s?: string) {
  return (s || "Preparing").trim().toLowerCase().replace(/\s+/g, "_");
}

const STATUS_ORDER = [
  { key: "preparing", label: "Preparing" },
  { key: "delivering", label: "Delivering" },
  { key: "delivered", label: "Delivered" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
];

// chunk array into pairs: [[a,b],[c,d]]
function chunk2<T>(arr: T[]) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

export default function AdminDashboardScreen() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qy = query(collection(db, "orders"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as OrderDoc);
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 AdminDashboard orders error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const computed = useMemo(() => {
    const now = new Date();

    let totalOrders = 0;
    let totalRevenue = 0;

    let todayOrders = 0;
    let todayRevenue = 0;

    const statusCounts: Record<string, number> = {};
    STATUS_ORDER.forEach((s) => (statusCounts[s.key] = 0));

    const itemCounts: Record<string, number> = {};

    for (const o of orders) {
      totalOrders += 1;

      const total = Number(o.totalAmount ?? o.total ?? 0) || 0;
      totalRevenue += total;

      const created = toDateSafe(o.createdAt);
      if (created && isSameDay(created, now)) {
        todayOrders += 1;
        todayRevenue += total;
      }

      const st = normalizeStatus(o.status);

      const alias: Record<string, string> = {
        in_progress: "preparing",
        out_for_delivery: "delivering",
        shipped: "delivering",
        completed: "delivered",
        ready: "ready_for_pickup",
        pickup_ready: "ready_for_pickup",
        pick_up: "ready_for_pickup",
      };

      const key = alias[st] ?? st;
      statusCounts[key] = (statusCounts[key] ?? 0) + 1;

      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const name = (it.name ?? "Unknown item").trim() || "Unknown item";
        const qty = Number(it.quantity ?? 1);
        itemCounts[name] =
          (itemCounts[name] ?? 0) + (Number.isFinite(qty) ? qty : 1);
      }
    }

    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, qty]) => ({ name, qty }));

    const maxTopQty = topItems.reduce((m, x) => Math.max(m, x.qty), 0);

    return {
      totalOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      statusCounts,
      topItems,
      maxTopQty,
    };
  }, [orders]);

  const screenW = Dimensions.get("window").width;
  const chartW = Math.min(screenW - spacing.xl * 2, 420);

  const pieData = useMemo(() => {
    const palette = [
      "rgba(107, 74, 58, 0.95)",
      "rgba(200, 155, 110, 0.95)",
      "rgba(40, 167, 69, 0.90)",
      "rgba(108, 117, 125, 0.90)",
    ];

    return STATUS_ORDER.map((s, idx) => ({
      name: s.label,
      population: computed.statusCounts[s.key] ?? 0,
      color: palette[idx] ?? palette[0],
      legendFontColor: colors.text,
      legendFontSize: 12,
    })).filter((x) => x.population > 0);
  }, [computed.statusCounts]);

  const statusPairs = useMemo(() => chunk2(STATUS_ORDER), []);
  const kpiPairs = useMemo(
    () => [
      [
        { label: "Total Orders", value: String(computed.totalOrders) },
        { label: "Today Orders", value: String(computed.todayOrders) },
      ],
    ],
    [computed.totalOrders, computed.todayOrders],
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>The Cozy Cup • Admin</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        ) : (
          <>
            {/* HERO SUMMARY */}
            <CozyCard style={styles.heroCard}>
              <Text style={styles.heroTitle}>Overview</Text>

              <View style={styles.heroRow}>
                <View style={styles.heroBlock}>
                  <Text style={styles.heroLabel}>Total Revenue</Text>
                  <Text style={styles.heroValue}>
                    {money(computed.totalRevenue)}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroBlock}>
                  <Text style={styles.heroLabel}>Today Revenue</Text>
                  <Text style={styles.heroValue}>
                    {money(computed.todayRevenue)}
                  </Text>
                </View>
              </View>

              <View style={{ height: spacing.md }} />

              {/* ✅ KPI minis side-by-side (no gap) */}
              {kpiPairs.map((pair, idx) => (
                <View key={idx} style={styles.twoColRow}>
                  <View style={[styles.kpiMini, styles.twoColItem]}>
                    <Text style={styles.kpiMiniLabel}>{pair[0].label}</Text>
                    <Text style={styles.kpiMiniValue}>{pair[0].value}</Text>
                  </View>

                  <View style={styles.twoColSpacer} />

                  <View style={[styles.kpiMini, styles.twoColItem]}>
                    <Text style={styles.kpiMiniLabel}>{pair[1].label}</Text>
                    <Text style={styles.kpiMiniValue}>{pair[1].value}</Text>
                  </View>
                </View>
              ))}
            </CozyCard>

            <View style={{ height: spacing.lg }} />

            {/* STATUS */}
            <CozyCard style={{ marginBottom: spacing.lg }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Orders Status</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{orders.length}</Text>
                </View>
              </View>

              {/* ✅ Status cards in 2 columns (no flexWrap / no gap) */}
              <View style={{ marginTop: spacing.sm }}>
                {statusPairs.map((pair, idx) => (
                  <View key={idx} style={styles.twoColRow}>
                    {pair[0] ? (
                      <View style={[styles.statusChip, styles.twoColItem]}>
                        <Text style={styles.statusChipLabel}>
                          {pair[0].label}
                        </Text>
                        <Text style={styles.statusChipValue}>
                          {computed.statusCounts[pair[0].key] ?? 0}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.twoColItem]} />
                    )}

                    <View style={styles.twoColSpacer} />

                    {pair[1] ? (
                      <View style={[styles.statusChip, styles.twoColItem]}>
                        <Text style={styles.statusChipLabel}>
                          {pair[1].label}
                        </Text>
                        <Text style={styles.statusChipValue}>
                          {computed.statusCounts[pair[1].key] ?? 0}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.twoColItem]} />
                    )}
                  </View>
                ))}
              </View>

              <View style={{ height: spacing.md }} />

              {pieData.length === 0 ? (
                <Text style={styles.muted}>No orders yet.</Text>
              ) : (
                <PieChart
                  data={pieData}
                  width={chartW}
                  height={210}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"12"}
                  chartConfig={chartConfig}
                  style={{ alignSelf: "center" }}
                />
              )}
            </CozyCard>

            {/* TOP ITEMS */}
            <CozyCard>
              <Text style={styles.sectionTitle}>Top Selling Items</Text>

              {computed.topItems.length === 0 ? (
                <Text style={styles.muted}>No order items yet.</Text>
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  {computed.topItems.map((x) => {
                    const pct =
                      computed.maxTopQty > 0
                        ? Math.max(0.08, x.qty / computed.maxTopQty)
                        : 0.08;

                    return (
                      <View key={x.name} style={styles.topRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.topName} numberOfLines={1}>
                            {x.name}
                          </Text>

                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${Math.round(pct * 100)}%` },
                              ]}
                            />
                          </View>
                        </View>

                        <Text style={styles.topQty}>{x.qty}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </CozyCard>

            <View style={{ height: spacing.xxl }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(107, 74, 58, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 30, 24, ${opacity})`,
  propsForLabels: { fontWeight: "700" as const },
};

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  loadingBox: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    marginTop: spacing.md,
  },
  loadingText: { marginTop: 10, color: colors.muted, fontWeight: "700" },

  heroCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  heroTitle: { fontWeight: "900", color: colors.text, fontSize: 16 },

  heroRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  heroDivider: {
    width: 1,
    height: 46,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  heroBlock: { flex: 1 },
  heroLabel: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  heroValue: {
    marginTop: 6,
    color: colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },

  /* ✅ reusable two-column row */
  twoColRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: spacing.md,
  },
  twoColItem: {
    flex: 1,
  },
  twoColSpacer: {
    width: spacing.md,
  },

  kpiMini: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kpiMiniLabel: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  kpiMiniValue: {
    marginTop: 6,
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  muted: { color: colors.muted, fontWeight: "700" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.primary, fontWeight: "900" },

  statusChip: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusChipLabel: { color: colors.muted, fontWeight: "900", fontSize: 12 },
  statusChipValue: {
    marginTop: 8,
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  topName: { color: colors.text, fontWeight: "900", fontSize: 13 },
  topQty: {
    color: colors.primary,
    fontWeight: "900",
    width: 36,
    textAlign: "right",
    marginLeft: spacing.md,
  },

  barTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(107, 74, 58, 0.06)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
