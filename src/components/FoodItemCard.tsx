import { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { colors } from "../theme/colors";

export default function FoodItemCard({ item, onPress }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "menuItems"),
      where("isAvailable", "==", true),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menu: any[] = [];

      snapshot.forEach((doc) => {
        menu.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setItems(menu);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.price}>R{item.price}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  addText: { color: colors.light, fontWeight: "700" },
  name: { fontWeight: "700", fontSize: 16 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  edit: { color: colors.primary, fontWeight: "600" },
  delete: { color: colors.danger, fontWeight: "600" },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.light,
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  info: {
    padding: 12,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
});
