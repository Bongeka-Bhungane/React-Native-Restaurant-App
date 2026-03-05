// src/screens/HomeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { collection, onSnapshot, query } from "firebase/firestore";

import Screen from "../components/Screen";
import CozyCard from "../components/CozyCard";
import CozyInput from "../components/CozyInput";
import CategoryChip from "../components/CategoryChip";
import CozyButton from "../components/CozyButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { db } from "../config/firebase";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // image URL
  category: "Beverages" | "Meals" | "Desserts" | "Banting" | "Extras" | string;
  subCategory?: string; // Coffee / Tea / Soft Drinks, etc.
  isActive?: boolean; // optional
  tags?: string[]; // optional
};

const CATEGORIES: Array<MenuItem["category"] | "All"> = [
  "All",
  "Beverages",
  "Meals",
  "Desserts",
  "Banting",
  "Extras",
];

function formatPrice(v: number) {
  if (typeof v !== "number") return "R 0.00";
  return `R ${v.toFixed(2)}`;
}

function safeStr(v: any, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Small animated wrapper around CategoryChip (pop animation) */
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

export default function HomeScreen({ navigation }: any) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");

  // ✅ Swipe-left animation for list when filters change
  const animX = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  const triggerListSwipe = () => {
    animX.setValue(40); // start from right
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
        const list: MenuItem[] = snap.docs.map((d) => {
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
            tags: Array.isArray(data.tags) ? data.tags : [],
          };
        });

        // Only show active items (if field missing, treat as active)
        const activeOnly = list.filter((x) => x.isActive !== false);

        setItems(activeOnly);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 Firestore menuItems error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  // Build subcategories dynamically based on selected category
  const subCategories = useMemo(() => {
    if (selectedCategory === "All") return ["All"];

    const subs = new Set<string>();
    items
      .filter((x) => x.category === selectedCategory)
      .forEach((x) => {
        if (x.subCategory?.trim()) subs.add(x.subCategory.trim());
      });

    return ["All", ...Array.from(subs)];
  }, [items, selectedCategory]);

  // Filter items
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return items.filter((x) => {
      const matchCategory =
        selectedCategory === "All" ? true : x.category === selectedCategory;

      const matchSub =
        selectedSubCategory === "All"
          ? true
          : (x.subCategory ?? "").trim() === selectedSubCategory;

      const matchSearch = !s
        ? true
        : `${x.name} ${x.description} ${x.category} ${x.subCategory ?? ""}`
            .toLowerCase()
            .includes(s);

      return matchCategory && matchSub && matchSearch;
    });
  }, [items, search, selectedCategory, selectedSubCategory]);

  // trigger swipe-left animation whenever filters change
  useEffect(() => {
    triggerListSwipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedSubCategory]);

  const renderItem = ({ item }: { item: MenuItem }) => {
    return (
      <Pressable
        onPress={() => navigation?.navigate?.("ViewItem", { item })}
        style={{ marginBottom: spacing.lg }}
      >
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
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>

                {!!item.subCategory && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{item.subCategory}</Text>
                  </View>
                )}
              </View>

              <View style={{ height: spacing.sm }} />

              <CozyButton
                label="View"
                onPress={() => navigation.navigate("ViewItem", { item })}
                style={{ height: 44 }}
              />
            </View>
          </View>
        </CozyCard>
      </Pressable>
    );
  };

  return (
    <Screen>
      {/* ✅ NON-SCROLLING TOP AREA (Search stays on top) */}
      <View style={styles.header}>
        <Text style={styles.title}>The Cozy Cup</Text>
        <Text style={styles.subtitle}>Choose something cozy ☕</Text>
      </View>

      <View style={styles.stickyControls}>
        <CozyInput
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search coffee, burgers, donuts..."
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(x) => String(x)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
          renderItem={({ item }) => (
            <AnimatedChip
              label={String(item)}
              selected={selectedCategory === item}
              onPress={() => {
                setSelectedCategory(item);
                setSelectedSubCategory("All");
              }}
            />
          )}
        />

        {subCategories.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Sub-category</Text>
            <FlatList
              data={subCategories}
              keyExtractor={(x) => x}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              renderItem={({ item }) => (
                <AnimatedChip
                  label={item}
                  selected={selectedSubCategory === item}
                  onPress={() => setSelectedSubCategory(item)}
                />
              )}
            />
          </>
        )}
      </View>

      {/* ✅ SCROLLING LIST ONLY */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading menu...</Text>
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
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: spacing.sm }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptyText}>
                  Try a different category or search term.
                </Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: spacing.xxl }} />}
          />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "700",
  },

  // ✅ stays on top (not part of the scroll list)
  stickyControls: {
    paddingBottom: spacing.sm,
  },

  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },

  imageWrap: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  itemName: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
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
  price: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(107, 74, 58, 0.10)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },

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
  loadingText: {
    color: colors.muted,
    fontWeight: "700",
  },

  emptyBox: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  emptyText: {
    marginTop: 6,
    color: colors.muted,
    fontWeight: "700",
  },
});
