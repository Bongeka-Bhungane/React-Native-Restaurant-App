import { View, Text, FlatList, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import CategoryCard from "../components/CategoryCard";

export default function CategoryScreen({ route, navigation }: any) {
  const { category } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{category.title}</Text>

      <FlatList
        data={category.subCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            title={item.title}
            onPress={() =>
              navigation.navigate("Items", {
                subCategory: item,
                categoryId: category.id,
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
});
