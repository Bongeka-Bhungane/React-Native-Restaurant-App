import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
    Switch,
    Image,
} from "react-native";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../theme/colors";

export default function ManageMenuScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);

  const fetchMenu = async () => {
    const snap = await getDocs(collection(db, "menuItems"));
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setItems(list);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchMenu);
    return unsubscribe;
  }, []);

  const deleteItem = async (id: string) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "menuItems", id));
          fetchMenu();
        },
      },
    ]);
  };

  const toggleAvailability = async (item: any) => {
    await updateDoc(doc(db, "menuItems", item.id), {
      isAvailable: !item.isAvailable,
    });

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isAvailable: !item.isAvailable } : i,
      ),
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Menu 🍔</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddEditMenu")}
      >
        <Text style={styles.addText}>+ Add Menu Item</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text>{item.category}</Text>
            <Text>R{item.price}</Text>

            {/* Availability */}
            <View style={styles.availabilityRow}>
              <Text style={{ fontWeight: "600" }}>
                {item.isAvailable ? "Available" : "Unavailable"}
              </Text>

              <Switch
                value={item.isAvailable}
                onValueChange={() => toggleAvailability(item)}
                trackColor={{ false: "#ccc", true: colors.primary }}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => navigation.navigate("AddEditMenu", { item })}
              >
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
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
  addText: {
    color: colors.light,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.light,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  edit: {
    color: colors.primary,
    fontWeight: "600",
  },
  toggle: {
    color: colors.accent,
    fontWeight: "600",
  },
  delete: {
    color: colors.danger,
    fontWeight: "600",
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
});
