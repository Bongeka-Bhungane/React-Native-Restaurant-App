import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../theme/colors";

import AdminDashboardScreen from "../../admin/screens/AdminDashboardScreen";
// import ManageMenuScreen from "../screens/admin/ManageMenuScreen";
// import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
// import AdminProfileScreen from "../screens/admin/AdminProfileScreen";

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }) => {
          let iconName = "grid";

          if (route.name === "Dashboard") iconName = "stats-chart";
          if (route.name === "Menu") iconName = "fast-food";
          if (route.name === "Orders") iconName = "receipt";
          if (route.name === "Profile") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      {/* <Tab.Screen name="Menu" component={ManageMenuScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} /> */}
    </Tab.Navigator>
  );
}
