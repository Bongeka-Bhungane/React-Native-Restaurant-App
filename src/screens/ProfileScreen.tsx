// src/screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyInput from "../components/CozyInput";
import CozyButton from "../components/CozyButton";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";

import { auth, db } from "../config/firebase";

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

// Convert Firestore Timestamp/date/string -> ms number for sorting
function toMillis(v: any): number {
  try {
    if (!v) return 0;
    if (typeof v?.toMillis === "function") return v.toMillis(); // Firestore Timestamp
    if (typeof v?.toDate === "function") return v.toDate().getTime();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  } catch {
    return 0;
  }
}

type OrderRow = {
  orderId: string;
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: any;
  address?: string;
  itemsCount?: number;
};

export default function ProfileScreen({ navigation }: any) {
  const user = auth.currentUser;

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Match your Registration/Firestore structure
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  // ✅ Match "card" map (registration stores: holder, numberMasked, exp)
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumberMasked, setCardNumberMasked] = useState("");
  const [cardExp, setCardExp] = useState("");

  // Orders
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const canSave = useMemo(() => {
    return (
      !saving &&
      name.trim().length >= 2 &&
      surname.trim().length >= 2 &&
      contactNumber.trim().length >= 6 &&
      address.trim().length >= 5
    );
  }, [saving, name, surname, contactNumber, address]);

  // ✅ Load profile
  useEffect(() => {
    (async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data: any = snap.data();

          setName(String(data?.name ?? ""));
          setSurname(String(data?.surname ?? ""));
          setEmail(String(data?.email ?? user.email ?? ""));
          setContactNumber(String(data?.contactNumber ?? ""));
          setAddress(String(data?.address ?? ""));

          const card = data?.card ?? {};
          setCardHolder(String(card?.holder ?? ""));
          setCardNumberMasked(String(card?.numberMasked ?? ""));
          setCardExp(String(card?.exp ?? ""));
        } else {
          // If doc missing, you'll still see auth email
          setEmail(user.email ?? "");
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  // ✅ Load orders WITHOUT orderBy (no index needed)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);

    const qy = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: OrderRow[] = snap.docs.map((d) => {
          const data: any = d.data();
          const items = Array.isArray(data?.items) ? data.items : [];
          const itemsCount = items.reduce(
            (sum: number, x: any) => sum + Number(x?.quantity || 0),
            0,
          );

          return {
            orderId: String(data?.orderId ?? d.id),
            totalAmount: Number(data?.totalAmount || 0),
            status: data?.status ?? "",
            paymentStatus: data?.paymentStatus ?? "",
            createdAt: data?.createdAt,
            address: data?.address ?? "",
            itemsCount,
          };
        });

        // ✅ Sort newest first in JS (no Firestore index)
        rows.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setOrders(rows);
        setOrdersLoading(false);
      },
      (err) => {
        console.error("Orders error:", err);
        setOrdersLoading(false);
        Alert.alert("Orders error", err?.message || "Failed to load orders.");
      },
    );

    return () => unsub();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login to edit your profile.");
      navigation.navigate("Login");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        surname: surname.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        email: (user.email ?? email).trim().toLowerCase(),

        card: {
          holder: cardHolder.trim(),
          numberMasked: cardNumberMasked.trim(),
          exp: cardExp.trim(),
        },

        updatedAt: serverTimestamp(),
      });

      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message || "Could not logout.");
    }
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Please login to continue</Text>
        </View>

        <CozyCard>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>The Cozy Cup ☕</Text>
        </View>

        {/* Profile */}
        <CozyCard>
          <Text style={styles.sectionTitle}>Personal details</Text>

          {loadingProfile ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading profile…</Text>
            </View>
          ) : (
            <>
              <CozyInput label="Name" value={name} onChangeText={setName} />
              <CozyInput
                label="Surname"
                value={surname}
                onChangeText={setSurname}
              />
              <CozyInput label="Email" value={email} editable={false} />

              <CozyInput
                label="Contact number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />

              <CozyInput
                label="Address"
                value={address}
                onChangeText={setAddress}
              />

              <View style={{ height: spacing.md }} />

              <Text style={styles.sectionTitle}>Card details</Text>

              <CozyInput
                label="Card holder"
                value={cardHolder}
                onChangeText={setCardHolder}
              />
              <CozyInput
                label="Card number (masked)"
                value={cardNumberMasked}
                onChangeText={setCardNumberMasked}
                placeholder="**** **** **** 4242"
              />
              <CozyInput
                label="Expiry"
                value={cardExp}
                onChangeText={setCardExp}
                placeholder="MM/YY"
              />

              <View style={{ height: spacing.md }} />

              <CozyButton
                label={saving ? "Saving..." : "Save changes"}
                onPress={handleSave}
                disabled={!canSave}
                loading={saving}
              />

              <View style={{ height: spacing.md }} />

              <CozyButton
                label="Logout"
                variant="outline"
                onPress={handleLogout}
                disabled={saving}
              />
            </>
          )}
        </CozyCard>

        <View style={{ height: spacing.lg }} />

        {/* Orders */}
        <CozyCard>
          <View style={styles.ordersHeaderRow}>
            <Text style={styles.sectionTitle}>Previous orders</Text>
            <Text style={styles.ordersCount}>{orders.length}</Text>
          </View>

          {ordersLoading ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading orders…</Text>
            </View>
          ) : orders.length === 0 ? (
            <Text style={styles.muted}>No orders yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {orders.map((o) => (
                <Pressable
                  key={o.orderId}
                  style={styles.orderRow}
                  onPress={() =>
                    navigation.navigate("OrderDetails", { orderId: o.orderId })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderTitle}>{o.orderId}</Text>
                    <Text style={styles.orderMeta}>
                      {formatDate(o.createdAt)} • {o.itemsCount ?? 0} item(s)
                    </Text>

                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                    >
                      {!!o.status && (
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>{o.status}</Text>
                        </View>
                      )}
                      {!!o.paymentStatus && (
                        <View style={styles.pillSoft}>
                          <Text style={styles.pillSoftText}>
                            {o.paymentStatus}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.orderTotal}>{money(o.totalAmount)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </CozyCard>

        <View style={{ height: spacing.xxl }} />
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

  ordersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  ordersCount: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: "900",
    color: colors.primary,
  },

  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orderTitle: { fontWeight: "900", color: colors.text, fontSize: 13 },
  orderMeta: { marginTop: 4, color: colors.muted, fontWeight: "700" },
  orderTotal: { fontWeight: "900", color: colors.primary, fontSize: 14 },

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
