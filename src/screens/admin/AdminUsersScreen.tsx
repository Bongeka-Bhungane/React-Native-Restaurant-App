// src/screens/admin/AdminUsersScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import CozyInput from "../../components/CozyInput";
import CozyButton from "../../components/CozyButton";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { db } from "../../config/firebase";

/* ================= Helpers ================= */

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

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function normalizeRole(v: any): "admin" | "user" {
  const r = safeStr(v).trim().toLowerCase();
  return r === "admin" ? "admin" : "user";
}

/* ================= Types ================= */

type UserDoc = {
  id: string; // doc id
  uid?: string;

  role?: "admin" | "user" | string;

  name?: string;
  surname?: string;
  email?: string;

  contactNumber?: string;
  address?: string;

  isActive?: boolean;

  createdAt?: any;
  updatedAt?: any;
};

type RoleFilter = "Customers" | "Admins";

/* ================= Screen ================= */

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Customers");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<UserDoc | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Order newest first (updatedAt or createdAt if you have both)
    // If some docs don't have timestamps, it still works.
    const qy = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: UserDoc[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            uid: data?.uid ?? d.id,
            role: data?.role ?? "user",
            name: data?.name ?? "",
            surname: data?.surname ?? "",
            email: data?.email ?? "",
            contactNumber: data?.contactNumber ?? "",
            address: data?.address ?? "",
            isActive: data?.isActive,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          };
        });

        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 AdminUsers error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return users.filter((u) => {
      const role = normalizeRole(u.role);

      const matchRole =
        roleFilter === "Admins" ? role === "admin" : role === "user";

      const matchSearch = !s
        ? true
        : `${u.name ?? ""} ${u.surname ?? ""} ${u.email ?? ""} ${
            u.contactNumber ?? ""
          }`
            .toLowerCase()
            .includes(s);

      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  const counts = useMemo(() => {
    let admins = 0;
    let customers = 0;
    for (const u of users) {
      const r = normalizeRole(u.role);
      if (r === "admin") admins += 1;
      else customers += 1;
    }
    return { admins, customers };
  }, [users]);

  const toggleActive = async (u: UserDoc) => {
    // Only if you store isActive
    try {
      setUpdating(true);

      const next = u.isActive === false ? true : false;

      await updateDoc(doc(db, "users", u.id), {
        isActive: next,
        updatedAt: new Date(),
      });

      Alert.alert("Updated", `User is now ${next ? "Active" : "Inactive"}.`);
    } catch (e: any) {
      console.log("🔥 toggleActive error:", e?.code, e?.message);
      Alert.alert("Update failed", e?.message || "Could not update user.");
    } finally {
      setUpdating(false);
    }
  };

  const RoleToggle = () => {
    return (
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setRoleFilter("Customers")}
          style={[
            styles.toggleBtn,
            roleFilter === "Customers"
              ? styles.toggleActive
              : styles.toggleInactive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              roleFilter === "Customers"
                ? styles.toggleTextActive
                : styles.toggleTextInactive,
            ]}
          >
            Customers ({counts.customers})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setRoleFilter("Admins")}
          style={[
            styles.toggleBtn,
            roleFilter === "Admins"
              ? styles.toggleActive
              : styles.toggleInactive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              roleFilter === "Admins"
                ? styles.toggleTextActive
                : styles.toggleTextInactive,
            ]}
          >
            Admins ({counts.admins})
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderRow = ({ item }: { item: UserDoc }) => {
    const fullName =
      `${safeStr(item.name).trim()} ${safeStr(item.surname).trim()}`.trim() ||
      "Unnamed user";

    const role = normalizeRole(item.role);
    const inactive = item.isActive === false;

    return (
      <Pressable
        onPress={() => setSelected(item)}
        style={{ marginBottom: spacing.lg }}
      >
        <CozyCard style={[inactive && { opacity: 0.6 }]}>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.email || "-"}
              </Text>

              {!!item.contactNumber && (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.contactNumber}
                </Text>
              )}
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.pillSoft}>
                <Text style={styles.pillSoftText}>
                  {role === "admin" ? "Admin" : "Customer"}
                </Text>
              </View>

              <View style={{ height: 8 }} />

              {typeof item.isActive === "boolean" && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {inactive ? "Inactive" : "Active"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: spacing.sm }} />
          <Text style={styles.tapHint}>Tap to view details</Text>
        </CozyCard>
      </Pressable>
    );
  };

  const SelectedUserModal = () => {
    if (!selected) return null;

    const fullName =
      `${safeStr(selected.name).trim()} ${safeStr(selected.surname).trim()}`.trim() ||
      "Unnamed user";

    const role = normalizeRole(selected.role);

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
                  <Text style={styles.modalTitle}>User</Text>
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {fullName}
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
                  <Text style={styles.label}>Role</Text>
                  <Text style={styles.value}>
                    {role === "admin" ? "Admin" : "Customer"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={[styles.value, styles.right]}>
                    {selected.email || "-"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Contact</Text>
                  <Text style={[styles.value, styles.right]}>
                    {selected.contactNumber || "-"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={[styles.value, styles.right]}>
                    {selected.address || "-"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Created</Text>
                  <Text style={[styles.value, styles.right]}>
                    {formatDate(selected.createdAt)}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.label}>Updated</Text>
                  <Text style={[styles.value, styles.right]}>
                    {formatDate(selected.updatedAt)}
                  </Text>
                </View>

                {typeof selected.isActive === "boolean" && (
                  <>
                    <View style={{ height: spacing.md }} />

                    <CozyButton
                      label={
                        selected.isActive === false
                          ? "Set Active"
                          : "Set Inactive"
                      }
                      onPress={() => toggleActive(selected)}
                      loading={updating}
                    />

                    <View style={{ height: spacing.sm }} />
                    
                  </>
                )}
              </CozyCard>

              <View style={{ height: spacing.md }} />

              <CozyButton
                label="Close"
                variant="outline"
                onPress={() => setSelected(null)}
                disabled={updating}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>View customers and admins</Text>
      </View>

      <RoleToggle />

      <View style={{ height: spacing.md }} />

      <CozyInput
        label="Search"
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, email, phone..."
      />

      <View style={{ height: spacing.md }} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading users…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <CozyCard>
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.muted}>Try another filter or search term.</Text>
        </CozyCard>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      )}

      <SelectedUserModal />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  // ✅ Toggle styling (same vibe as checkout toggle)
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(107, 74, 58, 0.08)",
    borderRadius: radius.xl,
    padding: 6,
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
  toggleText: { fontSize: 13, fontWeight: "900" },
  toggleTextActive: { color: colors.white },
  toggleTextInactive: { color: colors.primary },

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

  emptyTitle: { fontWeight: "900", color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontWeight: "700", marginTop: 8 },

  rowTop: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontWeight: "900", color: colors.text, fontSize: 14 },
  meta: { marginTop: 6, color: colors.muted, fontWeight: "700" },
  tapHint: { color: colors.muted, fontWeight: "700", fontSize: 12 },

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
    height: "88%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    marginLeft: spacing.md,
  },
  closeText: { fontSize: 16, fontWeight: "900", color: colors.primary },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  label: { color: colors.muted, fontWeight: "800" },
  value: { color: colors.text, fontWeight: "900" },
  right: { flex: 1, textAlign: "right" },
});
