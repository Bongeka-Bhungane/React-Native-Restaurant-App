import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import CozyInput from "../../components/CozyInput";
import CozyButton from "../../components/CozyButton";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { db } from "../../config/firebase";

/* ================= Helpers ================= */

function money(n: any) {
  return `R ${Number(n || 0).toFixed(2)}`;
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

function normalizeStatus(s?: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Best: store a field like orderType: "pickup" | "delivery"
 * For now: detect pickup by status keywords.
 */
function detectMode(order: any): "pickup" | "delivery" {
  const explicit = (
    order?.orderType ||
    order?.fulfillmentType ||
    ""
  ).toString();
  if (explicit.toLowerCase() === "pickup") return "pickup";
  if (explicit.toLowerCase() === "delivery") return "delivery";

  const st = normalizeStatus(order?.status);
  if (st.includes("pickup") || st.includes("pick_up") || st.includes("picked"))
    return "pickup";
  return "delivery";
}

type Step = { key: string; label: string };

function stepsFor(mode: "pickup" | "delivery"): Step[] {
  return mode === "pickup"
    ? [
        { key: "preparing", label: "Preparing" },
        { key: "ready_for_pickup", label: "Ready for Pickup" },
        { key: "picked_up", label: "Picked up" },
      ]
    : [
        { key: "preparing", label: "Preparing" },
        { key: "delivering", label: "Delivering" },
        { key: "delivered", label: "Delivered" },
      ];
}

function nextStatus(mode: "pickup" | "delivery", current?: string) {
  const steps = stepsFor(mode);
  const st = normalizeStatus(current);

  const alias: Record<string, string> = {
    in_progress: "preparing",
    out_for_delivery: "delivering",
    shipped: "delivering",
    completed: "delivered",
    ready: "ready_for_pickup",
    pickup_ready: "ready_for_pickup",
    collected: "picked_up",
  };

  const normalized = alias[st] ?? st;
  const idx = steps.findIndex((x) => x.key === normalized);
  if (idx < 0) return steps[0].key;
  return steps[Math.min(idx + 1, steps.length - 1)].key;
}

function isCompleted(mode: "pickup" | "delivery", status?: string) {
  const st = normalizeStatus(status);
  return mode === "pickup" ? st === "picked_up" : st === "delivered";
}

/* ================= Types ================= */

type OrderItem = {
  name?: string;
  quantity?: number;
  unitTotal?: number;
  totalPrice?: number;
  notes?: string;

  sidesDetailed?: { name: string; priceAddOn: number }[];
  extras?: { name: string; priceAddOn: number }[];

  temperature?: string;
  temperatureAddOn?: number;
};

type OrderDoc = {
  orderId: string;
  userId?: string;
  email?: string;
  address?: string;

  orderType?: "pickup" | "delivery";

  items?: OrderItem[];
  totalAmount?: number;
  paymentStatus?: string;
  paymentProvider?: string;
  status?: string;

  createdAt?: any;
  updatedAt?: any;
};

/* ================= Dropdown (no libs) ================= */

type DropdownItem = { label: string; value: string };

function CozyDropdown({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: DropdownItem[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const activeLabel =
    items.find((x) => x.value === value)?.label ?? String(value);

  return (
    <>
      <View style={styles.sectionLabelWrapper}>
        {" "}
        <Text style={styles.sectionLabel}>{label}</Text>
        <Pressable onPress={() => setOpen(true)} style={styles.dropdownBtn}>
          <Text style={styles.dropdownText}>{activeLabel}</Text>
          <Text style={styles.dropdownChevron}>▾</Text>
        </Pressable>
      </View>

      <Modal transparent visible={open} animationType="fade">
        <Pressable style={styles.ddOverlay} onPress={() => setOpen(false)}>
          {/* stop closing when tapping sheet */}
          <Pressable style={styles.ddSheet} onPress={() => {}}>
            <View style={styles.ddHeader}>
              <Text style={styles.ddTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ height: spacing.sm }} />

            {items.map((it) => {
              const selected = it.value === value;
              return (
                <Pressable
                  key={it.value}
                  onPress={() => {
                    onChange(it.value);
                    setOpen(false);
                  }}
                  style={[styles.ddRow, selected ? styles.ddRowSelected : null]}
                >
                  <Text
                    style={[
                      styles.ddRowText,
                      selected ? styles.ddRowTextSelected : null,
                    ]}
                  >
                    {it.label}
                  </Text>

                  {selected ? (
                    <View style={styles.ddBadge}>
                      <Text style={styles.ddBadgeText}>Selected</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            <View style={{ height: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ================= Screen ================= */

const FILTERS = ["Current", "Completed"] as const;
type FilterMode = (typeof FILTERS)[number];

const TYPE_FILTERS = ["All", "Delivery", "Pickup"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // dropdown values
  const [filterMode, setFilterMode] = useState<FilterMode>("Current");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [search, setSearch] = useState("");

  // modal
  const [selected, setSelected] = useState<OrderDoc | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const qy = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: OrderDoc[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            orderId: String(data?.orderId ?? d.id),
            userId: data?.userId ?? "",
            email: data?.email ?? "",
            address: data?.address ?? "",
            orderType: data?.orderType,
            items: Array.isArray(data?.items) ? data.items : [],
            totalAmount: Number(data?.totalAmount ?? 0),
            paymentStatus: data?.paymentStatus ?? "",
            paymentProvider: data?.paymentProvider ?? "",
            status: data?.status ?? "preparing",
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          };
        });

        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 AdminOrders error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return orders.filter((o) => {
      const mode = detectMode(o);
      const completed = isCompleted(mode, o.status);

      const matchFilter = filterMode === "Current" ? !completed : completed;

      const matchType =
        typeFilter === "All"
          ? true
          : typeFilter === "Pickup"
            ? mode === "pickup"
            : mode === "delivery";

      const matchSearch = !s
        ? true
        : `${o.orderId} ${o.email} ${o.address} ${o.status}`
            .toLowerCase()
            .includes(s);

      const paidOk =
        filterMode === "Completed"
          ? true
          : (o.paymentStatus || "").toLowerCase() === "paid" ||
            (o.paymentStatus || "").toLowerCase() === "success";

      return matchFilter && matchType && matchSearch && paidOk;
    });
  }, [orders, search, filterMode, typeFilter]);

  const updateOrderStatus = async (order: OrderDoc, newStatus: string) => {
    try {
      setUpdating(true);

      await updateDoc(doc(db, "orders", order.orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      Alert.alert("Updated", `Status set to "${newStatus.replace(/_/g, " ")}"`);
    } catch (e: any) {
      console.log("🔥 update status error:", e?.code, e?.message);
      Alert.alert("Update failed", e?.message || "Could not update order.");
    } finally {
      setUpdating(false);
    }
  };

  const renderRow = ({ item }: { item: OrderDoc }) => {
    const mode = detectMode(item);
    const st = normalizeStatus(item.status);

    const items = Array.isArray(item.items) ? item.items : [];
    const itemsCount = items.reduce(
      (sum, x) => sum + Number(x?.quantity || 0),
      0,
    );

    const completed = isCompleted(mode, item.status);

    return (
      <Pressable
        onPress={() => setSelected(item)}
        style={{ marginBottom: spacing.lg }}
      >
        <CozyCard style={[completed && { opacity: 0.65 }]}>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId} numberOfLines={1}>
                {item.orderId}
              </Text>
              <Text style={styles.meta}>
                {formatDate(item.createdAt)} • {itemsCount} item(s)
              </Text>
              {!!item.email && (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.email}
                </Text>
              )}
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.total}>{money(item.totalAmount)}</Text>
              <View style={{ height: 8 }} />
              <View style={styles.pillSoft}>
                <Text style={styles.pillSoftText}>
                  {mode === "pickup" ? "Pickup" : "Delivery"}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: spacing.sm }} />

          <View style={styles.statusRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{st.replace(/_/g, " ")}</Text>
            </View>

            {!!item.paymentStatus && (
              <View style={styles.pillSoft}>
                <Text style={styles.pillSoftText}>{item.paymentStatus}</Text>
              </View>
            )}
          </View>

          <View style={{ height: spacing.md }} />
          <Text style={styles.tapHint}>Tap to open & update</Text>
        </CozyCard>
      </Pressable>
    );
  };

  const SelectedOrderModal = () => {
    if (!selected) return null;

    const mode = detectMode(selected);
    const steps = stepsFor(mode);
    const currentKey = normalizeStatus(selected.status);
    const next = nextStatus(mode, selected.status);

    const items = Array.isArray(selected.items) ? selected.items : [];

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
            >
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Order</Text>
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {selected.orderId}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSelected(null)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <CozyCard>
                <View style={styles.modalRow}>
                  <Text style={styles.label}>Type</Text>
                  <Text style={styles.value}>
                    {mode === "pickup" ? "Pickup" : "Delivery"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.value}>
                    {normalizeStatus(selected.status).replace(/_/g, " ")}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Payment</Text>
                  <Text style={styles.value}>
                    {(selected.paymentStatus || "-").toString()}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Total</Text>
                  <Text style={[styles.value, { color: colors.primary }]}>
                    {money(selected.totalAmount)}
                  </Text>
                </View>

                <View style={{ height: spacing.sm }} />

                {!!selected.email && (
                  <View style={styles.modalRow}>
                    <Text style={styles.label}>Customer</Text>
                    <Text
                      style={[styles.value, { flex: 1, textAlign: "right" }]}
                    >
                      {selected.email}
                    </Text>
                  </View>
                )}

                {mode === "delivery" && (
                  <View style={styles.modalRow}>
                    <Text style={styles.label}>Address</Text>
                    <Text
                      style={[styles.value, { flex: 1, textAlign: "right" }]}
                    >
                      {selected.address || "-"}
                    </Text>
                  </View>
                )}
              </CozyCard>

              <View style={{ height: spacing.lg }} />

              <CozyCard>
                <Text style={styles.sectionTitle}>Tracking</Text>

                <View style={styles.progressRow}>
                  {steps.map((s, idx) => {
                    const done =
                      steps.findIndex((x) => x.key === currentKey) >= idx;
                    const current = s.key === currentKey;

                    return (
                      <View key={s.key} style={styles.stepWrap}>
                        <View
                          style={[
                            styles.stepCircle,
                            done ? styles.stepOn : styles.stepOff,
                            current ? styles.stepCurrent : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepNum,
                              done ? styles.stepNumOn : styles.stepNumOff,
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
                              steps.findIndex((x) => x.key === currentKey) > idx
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
                    ? "Pickup order: update to Ready, then Picked up."
                    : "Delivery order: update to Delivering, then Delivered."}
                </Text>

                <View style={{ height: spacing.md }} />

                <CozyButton
                  label={`Move to: ${next.replace(/_/g, " ")}`}
                  onPress={() => updateOrderStatus(selected, next)}
                  loading={updating}
                />

                <View style={{ height: spacing.sm }} />

                <CozyButton
                  label="Close"
                  variant="outline"
                  onPress={() => setSelected(null)}
                  disabled={updating}
                />
              </CozyCard>

              <View style={{ height: spacing.lg }} />

              <CozyCard>
                <Text style={styles.sectionTitle}>Items ({items.length})</Text>

                {items.length === 0 ? (
                  <Text style={styles.muted}>No items found.</Text>
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
                          : [];

                      const extras =
                        Array.isArray(it?.extras) && it.extras.length
                          ? it.extras.map(
                              (e) => `${e.name} (+${money(e.priceAddOn)})`,
                            )
                          : [];

                      return (
                        <View key={`${idx}`} style={styles.itemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>
                              {it?.name ?? "Item"}
                            </Text>
                            <Text style={styles.itemMeta}>
                              Qty: {qty} • Unit: {money(unit)}
                            </Text>

                            {!!it?.temperature && (
                              <Text style={styles.itemSmall}>
                                Temp: {it.temperature}
                                {Number(it.temperatureAddOn || 0) > 0
                                  ? ` (+${money(it.temperatureAddOn)})`
                                  : ""}
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

                          <Text style={styles.itemTotal}>
                            {money(rowTotal)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </CozyCard>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>View & update current orders</Text>
      </View>

      {/* Filters */}
      <View style={{ marginBottom: spacing.md }}>
        <CozyInput
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search orderId, email, status..."
        />

        {/* ✅ Dropdowns */}
        <CozyDropdown
          label="Filter"
          value={filterMode}
          items={[
            { label: "Current", value: "Current" },
            { label: "Completed", value: "Completed" },
          ]}
          onChange={(v) => setFilterMode(v as FilterMode)}
        />

        <CozyDropdown
          label="Type"
          value={typeFilter}
          items={[
            { label: "All", value: "All" },
            { label: "Delivery", value: "Delivery" },
            { label: "Pickup", value: "Pickup" },
          ]}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
        />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <CozyCard>
          <Text style={styles.emptyTitle}>No orders</Text>
          <Text style={styles.muted}>
            {filterMode === "Current"
              ? "No current paid orders right now."
              : "No completed orders found."}
          </Text>
        </CozyCard>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.orderId}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      )}

      <SelectedOrderModal />
    </Screen>
  );
}

const styles = StyleSheet.create({
    sectionLabelWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
  header: { alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: "900",
  },
  sectionTitle: { color: colors.text, fontWeight: "900", fontSize: 14 },

  /* Dropdown */
  dropdownBtn: {
    height: 48,
    width: "50%",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { color: colors.text, fontWeight: "900" },
  dropdownChevron: { color: colors.primary, fontWeight: "900", fontSize: 16 },

  ddOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  ddSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  ddHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  ddTitle: { fontSize: 18, fontWeight: "900", color: colors.text },

  ddRow: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ddRowSelected: {
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderColor: colors.primary,
  },
  ddRowText: { color: colors.text, fontWeight: "900" },
  ddRowTextSelected: { color: colors.primary },

  ddBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  ddBadgeText: { color: colors.white, fontWeight: "900", fontSize: 12 },

  /* existing */
  loadingBox: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 10,
    marginTop: spacing.md,
  },
  loadingText: { color: colors.muted, fontWeight: "700" },

  emptyTitle: { fontWeight: "900", color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontWeight: "700", marginTop: 8 },
  tapHint: { color: colors.muted, fontWeight: "700", fontSize: 12 },

  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  orderId: { fontWeight: "900", color: colors.text, fontSize: 14 },
  meta: { marginTop: 6, color: colors.muted, fontWeight: "700" },
  total: { fontWeight: "900", color: colors.primary, fontSize: 14 },

  statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

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

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    height: "92%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
  modalSub: { marginTop: 4, color: colors.muted, fontWeight: "700" },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 16, fontWeight: "900", color: colors.primary },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  label: { color: colors.muted, fontWeight: "800" },
  value: { color: colors.text, fontWeight: "900" },

  /* Tracking UI */
  progressRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepWrap: { flex: 1, alignItems: "center" },

  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  stepOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepOff: { backgroundColor: "transparent", borderColor: colors.border },
  stepCurrent: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  stepNum: { fontWeight: "900", fontSize: 13 },
  stepNumOn: { color: colors.white },
  stepNumOff: { color: colors.primary },

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

  /* Items */
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
});
