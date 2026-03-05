import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// Auth screens
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import AuthGate from "../screens/AuthGate";

// User screens
import HomeScreen from "../screens/HomeScreen";
import ViewItemScreen from "../screens/ViewItemScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import ProfileScreen from "../screens/ProfileScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";

// Admin screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminMenuScreen from "../screens/admin/AdminMenuScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AddAdminScreen from "../screens/admin/AddAdminScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";
// import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";

const Stack = createNativeStackNavigator();
const UserTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

/* =========================
   USER TABS
========================= */
function UserTabs() {
  return (
    <UserTab.Navigator screenOptions={{ headerShown: false }}>
      <UserTab.Screen name="Home" component={HomeScreen} />
      <UserTab.Screen name="ViewItem" component={ViewItemScreen} options={{ tabBarButton: () => null }} />
      <UserTab.Screen name="Cart" component={CartScreen} />
      <UserTab.Screen name="Checkout" component={CheckoutScreen} options={{ tabBarButton: () => null }} />
      <UserTab.Screen name="OrderDetails" component={OrderDetailsScreen} options={{tabBarButton: () => null}} />
      <UserTab.Screen name="Profile" component={ProfileScreen} />
    </UserTab.Navigator>
  );
}

/* =========================
   ADMIN TABS
========================= */
function AdminTabs() {
  return (
    <AdminTab.Navigator screenOptions={{ headerShown: false }}>
      <AdminTab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <AdminTab.Screen name="Menu" component={AdminMenuScreen} />
       <AdminTab.Screen name="AddAdmin" component={AddAdminScreen}  />
       <AdminTab.Screen name="Orders" component={AdminOrdersScreen} /> 
       <AdminTab.Screen name="Users" component={AdminUsersScreen} />
       <AdminTab.Screen name="Profile" component={AdminProfileScreen} />
    </AdminTab.Navigator>
  );
}

/* =========================
   ROOT NAVIGATOR
========================= */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthGate" component={AuthGate} />

        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="UserTabs" component={UserTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
