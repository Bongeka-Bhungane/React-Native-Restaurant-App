import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminTabs from "./AdminTabs";
import AddEditMenuItemScreen from "../screens/AddEditMenuItemScreen";
import ManageMenuScreen from "../screens/ManageMenuScreen";

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
      <Stack.Screen name="AddEditMenu" component={AddEditMenuItemScreen} />
    </Stack.Navigator>
  );
}
