// src/screens/admin/AdminMenuScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import Screen from "../../components/Screen";
import CozyCard from "../../components/CozyCard";
import CozyButton from "../../components/CozyButton";
import CozyInput from "../../components/CozyInput";
import CategoryChip from "../../components/CategoryChip";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { db } from "../../config/firebase";

type MenuItemDoc = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // URL
  category: string; // Beverages / Meals / Desserts / Banting / Extras
  subCategory?: string; // Coffee / Tea / Soft Drinks etc
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const CATEGORIES = [
  "All",
  "Beverages",
  "Meals",
  "Desserts",
  "Banting",
  "Extras",
];

function formatPrice(v: number) {
  const n = Number(v || 0);
  return `R ${n.toFixed(2)}`;
}

function normalizeText(s: string) {
  return (s ?? "").trim();
}

function safeStr(v: any, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** ✅ Animated wrapper around CategoryChip (pop animation like HomeScreen) */
function AnimatedChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.06 : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [selected, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <CategoryChip label={label} selected={selected} onPress={onPress} />
    </Animated.View>
  );
}

export default function AdminMenuScreen() {
  const [items, setItems] = useState<MenuItemDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ sticky controls
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Beverages");
  const [subCategory, setSubCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  // ✅ swipe-left animation for list (same vibe as HomeScreen)
  const animX = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  const triggerListSwipe = () => {
    animX.setValue(40);
    animOpacity.setValue(0.2);

    Animated.parallel([
      Animated.timing(animX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const qy = query(collection(db, "menuItems"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: MenuItemDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: safeStr(data.name),
            description: safeStr(data.description),
            price: safeNum(data.price, 0),
            image: safeStr(data.image),
            category: safeStr(data.category, "Extras"),
            subCategory: safeStr(data.subCategory),
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        // newest first
        list.sort((a, b) => {
          const at =
            a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
          const bt =
            b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
          return bt - at;
        });

        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 AdminMenuScreen error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return items.filter((x) => {
      const matchCat =
        selectedCategory === "All" ? true : x.category === selectedCategory;

      const matchSearch = !s
        ? true
        : `${x.name} ${x.description} ${x.category} ${x.subCategory ?? ""}`
            .toLowerCase()
            .includes(s);

      return matchCat && matchSearch;
    });
  }, [items, search, selectedCategory]);

  // ✅ animate list whenever filters change
  useEffect(() => {
    triggerListSwipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setCategory("Beverages");
    setSubCategory("");
    setIsActive(true);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: MenuItemDoc) => {
    setEditingId(item.id);
    setName(item.name ?? "");
    setDescription(item.description ?? "");
    setPrice(String(item.price ?? 0));
    setImage(item.image ?? "");
    setCategory(item.category ?? "Beverages");
    setSubCategory(item.subCategory ?? "");
    setIsActive(item.isActive !== false);
    setModalOpen(true);
  };

  const validate = () => {
    const nm = normalizeText(name);
    const desc = normalizeText(description);
    const cat = normalizeText(category);
    const pr = Number(price);

    if (nm.length < 2) return "Please enter a valid name.";
    if (desc.length < 5) return "Please enter a description (min 5 chars).";
    if (!Number.isFinite(pr) || pr <= 0)
      return "Please enter a valid price (e.g. 35).";
    if (cat.length < 2) return "Please select a category.";
    return null;
  };

  const saveItem = async () => {
    const errMsg = validate();
    if (errMsg) {
      Alert.alert("Fix form", errMsg);
      return;
    }

    const payload = {
      name: normalizeText(name),
      description: normalizeText(description),
      price: Number(price),
      image: normalizeText(image),
      category: normalizeText(category),
      subCategory: normalizeText(subCategory),
      isActive: !!isActive,
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateDoc(doc(db, "menuItems", editingId), payload);
      } else {
        await addDoc(collection(db, "menuItems"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setModalOpen(false);
      resetForm();
    } catch (e: any) {
      console.log("🔥 saveItem error:", e?.code, e?.message);
      Alert.alert("Save failed", e?.message || "Could not save item.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: MenuItemDoc) => {
    Alert.alert("Delete item?", `Delete "${item.name}" permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => doDelete(item.id),
      },
    ]);
  };

  const doDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "menuItems", id));
    } catch (e: any) {
      console.log("🔥 delete error:", e?.code, e?.message);
      Alert.alert("Delete failed", e?.message || "Could not delete item.");
    }
  };

  const toggleActive = async (item: MenuItemDoc) => {
    try {
      const next = item.isActive === false ? true : false;
      await updateDoc(doc(db, "menuItems", item.id), {
        isActive: next,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.log("🔥 toggleActive error:", e?.code, e?.message);
      Alert.alert("Update failed", e?.message || "Could not update item.");
    }
  };

  const renderItem = ({ item }: { item: MenuItemDoc }) => {
    const inactive = item.isActive === false;

    return (
      <View style={{ marginBottom: spacing.lg }}>
        <CozyCard style={[inactive && { opacity: 0.55 }]}>
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
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>

                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.category}</Text>
                </View>
              </View>

              {!!item.subCategory && (
                <Text style={styles.subText}>Sub: {item.subCategory}</Text>
              )}

              <View style={{ height: spacing.md }} />

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => toggleActive(item)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionText}>
                    {inactive ? "Show" : "Hide"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => confirmDelete(item)}
                  style={styles.actionBtnDanger}
                >
                  <Text style={styles.actionTextDanger}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </CozyCard>
      </View>
    );
  };

  return (
    <Screen>
      {/* ===== Top Header ===== */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Menu</Text>
      </View>

      {/* ✅ Sticky controls (NOT inside list) */}
      <View style={styles.stickyControls}>
        <CozyButton label="+ Add Menu Item" onPress={openAdd} />

        <View style={{ height: spacing.md }} />

        <CozyInput
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search items…"
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(x) => x}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
          renderItem={({ item }) => (
            <AnimatedChip
              label={item}
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
            />
          )}
        />
      </View>

      {/* ===== List Area ===== */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading menu…</Text>
        </View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: animOpacity,
            transform: [{ translateX: animX }],
          }}
        >
          <FlatList
            data={filtered}
            keyExtractor={(x) => x.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: spacing.sm,
              paddingBottom: spacing.xxl,
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No menu items</Text>
                <Text style={styles.emptyText}>
                  Try another category or search term — or add a new item above.
                </Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* ================= MODAL ================= */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: spacing.xl }}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingId ? "Edit Item" : "Add Item"}
                  </Text>

                  <Pressable
                    onPress={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                </View>

                <CozyInput
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Cappuccino"
                />
                <CozyInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ingredients / details"
                />
                <CozyInput
                  label="Price (R)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 35"
                />
                <CozyInput
                  label="Image URL (optional)"
                  value={image}
                  onChangeText={setImage}
                  autoCapitalize="none"
                  placeholder="https://..."
                />

                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => {
                    const selected = category === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[
                          styles.catBtn,
                          selected
                            ? styles.catBtnActive
                            : styles.catBtnInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catText,
                            selected
                              ? styles.catTextActive
                              : styles.catTextInactive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <CozyInput
                  label="Sub-category (optional)"
                  value={subCategory}
                  onChangeText={setSubCategory}
                  placeholder="Coffee / Tea / Soft Drinks / Burgers..."
                />

                <View style={{ height: spacing.sm }} />

                <View style={styles.activeRow}>
                  <Text style={styles.activeLabel}>Visible to users</Text>
                  <Pressable
                    onPress={() => setIsActive((p) => !p)}
                    style={[
                      styles.switchPill,
                      isActive ? styles.switchOn : styles.switchOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        isActive ? styles.switchTextOn : styles.switchTextOff,
                      ]}
                    >
                      {isActive ? "Yes" : "No"}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ height: spacing.lg }} />

                <CozyButton
                  label={editingId ? "Save changes" : "Add item"}
                  onPress={saveItem}
                  loading={saving}
                />

                <View style={{ height: spacing.md }} />

                <CozyButton
                  label="Cancel"
                  variant="outline"
                  onPress={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  // ✅ sticky controls area (same idea as HomeScreen)
  stickyControls: {
    paddingBottom: spacing.sm,
  },

  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: "900",
  },

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

  itemName: { fontSize: 16, fontWeight: "900", color: colors.text },
  itemDesc: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "600",
    lineHeight: 18,
  },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  price: { fontSize: 15, fontWeight: "900", color: colors.primary },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  subText: {
    marginTop: 8,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  actionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.primary, fontWeight: "900", fontSize: 12 },

  actionBtnDanger: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: "rgba(217, 83, 79, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(217, 83, 79, 0.35)",
  },
  actionTextDanger: { color: colors.danger, fontWeight: "900", fontSize: 12 },

  loadingBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 10,
  },
  loadingText: { color: colors.muted, fontWeight: "700" },

  emptyBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  emptyText: { marginTop: 6, color: colors.muted, fontWeight: "700" },

  // Modal
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
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

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
  },
  catBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  catBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catBtnInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  catText: { fontWeight: "900", fontSize: 12 },
  catTextActive: { color: colors.white },
  catTextInactive: { color: colors.primary },

  activeRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeLabel: { color: colors.text, fontWeight: "900" },
  switchPill: {
    minWidth: 80,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  switchOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  switchOff: { backgroundColor: colors.surface, borderColor: colors.border },
  switchText: { fontWeight: "900", fontSize: 12 },
  switchTextOn: { color: colors.white },
  switchTextOff: { color: colors.primary },
});
