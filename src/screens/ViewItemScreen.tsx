import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { colors } from "../theme/colors";
import { showSuccess } from "../utils/toast";
import { useCart } from "../context/CartContext";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export default function ViewItemScreen({ route, navigation }: any) {
  const item: MenuItem | undefined = route?.params?.item;

  // ✅ Safety guard (VERY important)
  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found 😢</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBack}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);

  const extrasOptions = ["Extra Sauce", "Fried Chips", "Nuggets"];
  const sideOptions = ["Salad", "Chips", "Pap"];
  const drinkOptions = ["Coke", "Sprite", "Water"];

  const { addToCart } = useCart();

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra],
    );
  };

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity,
      extras: selectedExtras,
      side: selectedSide,
      drink: selectedDrink,
    });

    showSuccess(`${item.name} added to cart ☕`);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>R{item.price}</Text>

        {/* Side Options */}
        <Text style={styles.sectionTitle}>Choose a side</Text>
        <View style={styles.optionsContainer}>
          {sideOptions.map((side) => (
            <TouchableOpacity
              key={side}
              style={[
                styles.optionButton,
                selectedSide === side && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedSide(side)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedSide === side && { color: colors.light },
                ]}
              >
                {side}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Drink Options */}
        <Text style={styles.sectionTitle}>Choose a drink</Text>
        <View style={styles.optionsContainer}>
          {drinkOptions.map((drink) => (
            <TouchableOpacity
              key={drink}
              style={[
                styles.optionButton,
                selectedDrink === drink && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedDrink(drink)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDrink === drink && { color: colors.light },
                ]}
              >
                {drink}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Extras */}
        <Text style={styles.sectionTitle}>Extras</Text>
        <View style={styles.optionsContainer}>
          {extrasOptions.map((extra) => (
            <TouchableOpacity
              key={extra}
              style={[
                styles.optionButton,
                selectedExtras.includes(extra) && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => toggleExtra(extra)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedExtras.includes(extra) && { color: colors.light },
                ]}
              >
                {extra}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity */}
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.quantityText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantityNumber}>{quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={styles.quantityText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 220 },
  info: { padding: 16 },

  name: { fontSize: 22, fontWeight: "700", color: colors.primary },
  description: { fontSize: 14, color: colors.textSecondary, marginVertical: 6 },
  price: { fontSize: 18, fontWeight: "600", color: colors.primary },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 14 },
  optionsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },

  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.light,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  optionText: { fontSize: 14, fontWeight: "600", color: colors.text },

  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },

  quantityButton: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 8,
  },

  quantityText: { fontSize: 18, fontWeight: "700" },
  quantityNumber: { fontSize: 18, fontWeight: "700", marginHorizontal: 20 },

  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  addButtonText: { color: colors.light, fontWeight: "700", fontSize: 16 },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { fontSize: 18, marginBottom: 10 },
  goBack: { color: colors.primary, fontWeight: "700" },
});
