import { Redirect, useLocalSearchParams } from "expo-router";
// Keep older deep links in the same station flow and connection lifecycle.
export default function LegacyConfig() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return (
    <Redirect
      href={{ pathname: "/station", params: { name: name || "Estação CASA" } }}
    />
  );
}
