import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { popularItems } from "../data/menuItems";
import FoodItemCard from "../components/FoodItemCard";
import { colors } from "../theme/colors";

const categories = [
  "All",
  "coffee",
  "tea",
  "soft_drinks",
  "sandwich",
  "wraps",
  "burgers",
  "cakes",
  "donuts",
  "banting",
  "extras",
];

export default function HomeScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems =
    selectedCategory === "All"
      ? popularItems
      : popularItems.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to the Cozy Cup ☕</Text>
      <Text style={styles.header}>Menu</Text>

      {/* Category Filter */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.categories}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && { color: colors.light },
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Popular Items List */}
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
});
