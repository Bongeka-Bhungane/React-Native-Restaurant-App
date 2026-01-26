import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./src/screens/HomeScreen";
import CartScreen from "./src/screens/CartScreen";
import Ionicons from "react-native-vector-icons/Ionicons";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
// import ProfileScreen from "./src/screens/";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen name="Checkout" component={CheckoutScreen} />

      <Tab.Screen name="ProfileTab" component={UserProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
