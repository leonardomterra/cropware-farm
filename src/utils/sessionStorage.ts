import { getStoredValue, removeStoredValue, setStoredValue } from "./appStorage";

export const ACCESS_TOKEN_KEY = "farm_access_token";
export const REFRESH_TOKEN_KEY = "farm_refresh_token";
export const EXPIRES_AT_KEY = "farm_access_token_expires_at";

export async function getAccessToken() {
  return getStoredValue(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getStoredValue(REFRESH_TOKEN_KEY);
}

export async function getSessionTokens() {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    getStoredValue(ACCESS_TOKEN_KEY),
    getStoredValue(REFRESH_TOKEN_KEY),
    getStoredValue(EXPIRES_AT_KEY),
  ]);
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : null,
  };
}

export async function persistSessionTokens(
  accessToken: string,
  refreshToken?: string | null,
  expiresAt?: number | null,
) {
  await setStoredValue(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await setStoredValue(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await removeStoredValue(REFRESH_TOKEN_KEY);
  }
  if (typeof expiresAt === "number") {
    await setStoredValue(EXPIRES_AT_KEY, String(expiresAt));
  } else {
    await removeStoredValue(EXPIRES_AT_KEY);
  }
}

export async function clearSessionTokens() {
  await Promise.all([
    removeStoredValue(ACCESS_TOKEN_KEY),
    removeStoredValue(REFRESH_TOKEN_KEY),
    removeStoredValue(EXPIRES_AT_KEY),
  ]);
}
