import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export default function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard 📊</Text>
      <Text>Orders • Revenue • Customers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.primary },
});
