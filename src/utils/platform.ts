import { Capacitor } from "@capacitor/core";

export function isNativeCapacitorApp() {
  return Capacitor.isNativePlatform();
}

export function isCapacitorIOS() {
  return Capacitor.getPlatform() === "ios" && Capacitor.isNativePlatform();
}
