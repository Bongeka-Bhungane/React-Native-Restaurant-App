import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function FoodItemCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>R{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.light,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
