import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Switch,
} from "react-native";
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../theme/colors";

const CATEGORIES = [
  "Coffee",
  "Tea",
  "sandwiches and wraps",
  "Desserts",
  "Cold Drinks",
  "extras",
];

export default function AddEditMenuItemScreen({ route, navigation }: any) {
  const item = route.params?.item;

  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [image, setImage] = useState(item?.image || "");
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);

  const [showCategories, setShowCategories] = useState(false);

  const saveItem = async () => {
    if (!name || !price || !category) return;

    const payload = {
      name,
      category,
      description,
      image,
      price: Number(price),
      isAvailable,
      createdAt: item ? item.createdAt : serverTimestamp(),
    };

    try {
      if (item) {
        await updateDoc(doc(db, "menuItems", item.id), payload);
      } else {
        await addDoc(collection(db, "menuItems"), payload);
      }

      navigation.goBack();
    } catch (error) {
      console.log("Error saving item:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{item ? "Edit Item" : "Add Item"} 🍔</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      {/* CATEGORY DROPDOWN */}
      <Text style={styles.label}>Category</Text>

      <Pressable
        style={styles.dropdown}
        onPress={() => setShowCategories(!showCategories)}
      >
        <Text style={styles.dropdownText}>{category || "Select category"}</Text>
      </Pressable>

      {showCategories && (
        <View style={styles.dropdownList}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={styles.dropdownItem}
              onPress={() => {
                setCategory(cat);
                setShowCategories(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        style={styles.input}
        placeholder="Image URL"
        value={image}
        onChangeText={setImage}
      />

      {/* AVAILABILITY TOGGLE */}
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Available</Text>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          thumbColor={colors.light}
          trackColor={{
            false: colors.border,
            true: colors.primary,
          }}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
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
    marginBottom: 16,
    color: colors.primary,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.light,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    color: colors.text,
  },
  dropdown: {
    backgroundColor: colors.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  dropdownText: {
    color: colors.text,
  },
  dropdownList: {
    backgroundColor: colors.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    color: colors.text,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: colors.light,
    fontWeight: "700",
  },
});
