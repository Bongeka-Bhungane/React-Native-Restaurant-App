import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "grid";

          if (route.name === "Dashboard") iconName = "stats-chart";
          if (route.name === "Menu") iconName = "fast-food";
          if (route.name === "Admins") iconName = "people";
          if (route.name === "Orders") iconName = "receipt";
          if (route.name === "Profile") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Menu" component={ManageMenuScreen} />
      <Tab.Screen
        name="Admins"
        component={AddAdminScreen}
        options={{ title: "Admins" }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
     
    </Tab.Navigator>
  );
}
