import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import BLEService from "../services/ble";

// Both back buttons leave the entire station flow, never a stale BLE screen.
export function useStationBack() {
  const router = useRouter();
  const leave = useCallback(() => {
    void BLEService.disconnect()
      .catch(() => {})
      .finally(() => router.replace("/"));
  }, [router]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          leave();
          return true;
        },
      );
      return () => subscription.remove();
    }, [leave]),
  );
  return leave;
}
