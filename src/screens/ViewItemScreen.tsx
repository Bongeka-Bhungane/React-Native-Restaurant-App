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

/* ================= TYPES ================= */

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

/* ================= PRICING ================= */

const SIDE_PRICES: Record<string, number> = {
  Chips: 20,
  Salad: 30,
  Pap: 15,
  Nuggets: 40,
};

const EXTRA_PRICE = 7;

/* ================= SCREEN ================= */

export default function ViewItemScreen({ route, navigation }: any) {
  const item: MenuItem | undefined = route?.params?.item;

  /* 🛑 Safety Guard */
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

  /* ================= STATE ================= */

  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedSides, setSelectedSides] = useState<string[]>([]);

  const extrasOptions = ["Extra Sauce", "Extra Cheese", "Extra Toppings"];
  const sideOptions = ["Salad", "Chips", "Pap", "Nuggets"];

  const { addToCart } = useCart();

  /* ================= LOGIC ================= */

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra],
    );
  };

  const toggleSide = (side: string) => {
    setSelectedSides((prev) =>
      prev.includes(side) ? prev.filter((s) => s !== side) : [...prev, side],
    );
  };

  const sidePrice = selectedSides.reduce(
    (total, side) => total + (SIDE_PRICES[side] ?? 0),
    0,
  );

  const extrasPrice = selectedExtras.length * EXTRA_PRICE;

  const singleItemTotal = item.price + sidePrice + extrasPrice;
  const totalPrice = singleItemTotal * quantity;

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: singleItemTotal, // price per item
      image: item.image,
      quantity,
      extras: selectedExtras,
      sides: selectedSides,
    });

    showSuccess(`${item.name} added to cart ☕`);
    navigation.goBack();
  };

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>Base price: R{item.price}</Text>

        {/* ===== SIDES ===== */}
        <Text style={styles.sectionTitle}>Choose sides</Text>
        <View style={styles.optionsContainer}>
          {sideOptions.map((side) => (
            <TouchableOpacity
              key={side}
              style={[
                styles.optionButton,
                selectedSides.includes(side) && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => toggleSide(side)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedSides.includes(side) && { color: colors.light },
                ]}
              >
                {side} (+R{SIDE_PRICES[side]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== EXTRAS ===== */}
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
                {extra} (+R{EXTRA_PRICE})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== QUANTITY ===== */}
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

        {/* ===== TOTAL ===== */}
        <View style={styles.totalBox}>
          {selectedSides.length > 0 && (
            <Text style={styles.breakdownText}>
              Sides ({selectedSides.length}): +R{sidePrice}
            </Text>
          )}

          {selectedExtras.length > 0 && (
            <Text style={styles.breakdownText}>
              Extras ({selectedExtras.length}): +R{extrasPrice}
            </Text>
          )}

          <Text style={styles.totalText}>Total: R{totalPrice}</Text>
        </View>

        {/* ===== ADD TO CART ===== */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 220 },

  info: { padding: 16 },

  name: { fontSize: 22, fontWeight: "700", color: colors.primary },
  description: { fontSize: 14, color: colors.textSecondary, marginVertical: 6 },
  price: { fontSize: 16, fontWeight: "600", color: colors.primary },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 14 },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

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

  totalBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.light,
  },

  breakdownText: { fontSize: 14 },
  totalText: { fontSize: 18, fontWeight: "700", marginTop: 4 },

  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },

  addButtonText: {
    color: colors.light,
    fontWeight: "700",
    fontSize: 16,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: { fontSize: 18, marginBottom: 10 },
  goBack: { color: colors.primary, fontWeight: "700" },
});
