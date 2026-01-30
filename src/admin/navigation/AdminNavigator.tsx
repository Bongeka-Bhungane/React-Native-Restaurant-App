import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminTabs from "./AdminTabs";
import AddEditMenuItemScreen from "../screens/AddEditMenuItemScreen";
import ManageMenuScreen from "../screens/ManageMenuScreen";
import AddAdminScreen from "../screens/AddAdminScreen";

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
      <Stack.Screen name="AddEditMenu" component={AddEditMenuItemScreen} />
      <Stack.Screen name="AddAdmin" component={AddAdminScreen} />
    </Stack.Navigator>
  );
}
