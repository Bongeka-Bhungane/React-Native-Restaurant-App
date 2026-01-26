import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal } =
    useCart();

  const renderItem = ({ item }: any) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.side && <Text style={styles.option}>Side: {item.side}</Text>}
        {item.drink && <Text style={styles.option}>Drink: {item.drink}</Text>}
        {item.extras && item.extras.length > 0 && (
          <Text style={styles.option}>Extras: {item.extras.join(", ")}</Text>
        )}
        <Text style={styles.price}>R{item.price * item.quantity}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Text style={styles.quantityText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityNumber}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.quantityText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
        <Ionicons name="trash-outline" size={24} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cart.length === 0 ? (
        <Text style={styles.empty}>Your cart is empty ☕</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 80 }}
          />

          <View style={styles.footer}>
            <Text style={styles.total}>Total: R{getTotal()}</Text>
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Go to Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  empty: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
    color: colors.textSecondary,
  },
  itemContainer: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.light,
    borderRadius: 12,
    alignItems: "center",
  },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.primary },
  option: { fontSize: 14, color: colors.textSecondary },
  price: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    padding: 6,
    backgroundColor: colors.light,
    borderRadius: 6,
  },
  quantityText: { fontSize: 16, fontWeight: "700", color: colors.text },
  quantityNumber: { fontSize: 16, fontWeight: "700", marginHorizontal: 12 },
  footer: { paddingVertical: 16 },
  total: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  checkoutText: { color: colors.light, fontWeight: "700", fontSize: 16 },
  clearButton: {
    backgroundColor: colors.danger,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  clearText: { color: colors.light, fontWeight: "700" },
});
