import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import FoodItemCard from "../components/FoodItemCard";
import { colors } from "../theme/colors";

export default function HomeScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  console.log("🏠 HomeScreen mounted");

  useEffect(() => {
    const q = query(
      collection(db, "menuItems"),
      where("isAvailable", "==", true),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menu: any[] = [];
      const categorySet = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const normalizedCategory = data.category
          ?.toString()
          .trim()
          .toLowerCase();

        menu.push({
          id: doc.id,
          ...data,
          category: normalizedCategory,
        });

        if (normalizedCategory) {
          categorySet.add(normalizedCategory);
        }
      });

      setItems(menu);

      setCategories([
        "All",
        ...Array.from(categorySet).map(
          (c) => c.charAt(0).toUpperCase() + c.slice(1),
        ),
      ]);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter(
          (item) =>
            item.category === selectedCategory.toString().trim().toLowerCase(),
        );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to the Cozy Cup ☕</Text>
      <Text style={styles.header}>Menu</Text>

      {/* Categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && {
                  color: colors.light,
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Items */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FoodItemCard
            item={item}
            onPress={() => navigation.navigate("ViewItem", { item })}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            No items available ☕
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  categories: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.light,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
