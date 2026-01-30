import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { View, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

import AdminDashboardScreen from "../../admin/screens/AdminDashboardScreen";
import ManageMenuScreen from "../../admin/screens/ManageMenuScreen";
import AddAdminScreen from "../../admin/screens/AddAdminScreen";
import AdminUsersScreen from "../../admin/screens/AdminUsersScreen";
import AdminOrdersScreen from "../../admin/screens/AdminOrdersScreen";
import AdminProfileScreen from "../../admin/screens/AdminProfileScreen";

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.light,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = "grid";

          if (route.name === "Dashboard") iconName = "stats-chart";
          if (route.name === "Menu") iconName = "fast-food";
          if (route.name === "Admins") iconName = "people";
          if (route.name === "Users") iconName = "people";
          if (route.name === "Orders") iconName = "receipt";
          if (route.name === "Profile") iconName = "person";

          return (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name={iconName}
                size={focused ? size + 4 : size}
                color={focused ? colors.light : color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Menu" component={ManageMenuScreen} />
      <Tab.Screen name="Admins" component={AddAdminScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 10,
    backgroundColor: colors.light,
    borderRadius: 30,
    height: 70,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
