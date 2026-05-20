import { Preferences } from "@capacitor/preferences";
import { isNativeCapacitorApp } from "./platform";

export async function getStoredValue(key: string): Promise<string | null> {
  if (isNativeCapacitorApp()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  if (isNativeCapacitorApp()) {
    await Preferences.set({ key, value });
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  if (isNativeCapacitorApp()) {
    await Preferences.remove({ key });
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getStoredValue(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredJson(key: string, value: unknown): Promise<void> {
  await setStoredValue(key, JSON.stringify(value));
}
