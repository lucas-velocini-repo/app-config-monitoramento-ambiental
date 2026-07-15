import { Tabs } from "expo-router";
import { Bluetooth, Settings } from "lucide-react-native";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0056b3",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#0056b3",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <Bluetooth color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: "Configuração",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
