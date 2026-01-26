import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ViewItemScreen from "../screens/ViewItemScreen";
import AppTabs from "../../AppTabs";
import CheckoutScreen from "../screens/CheckoutScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="App" component={AppTabs} />
      <Stack.Screen name="ViewItem" component={ViewItemScreen} />
      {/* <Stack.Screen name="Checkout" component={CheckoutScreen} /> */}
    </Stack.Navigator>
  );
}
