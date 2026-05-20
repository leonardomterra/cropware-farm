import { createClient } from "@supabase/supabase-js";
import { anonKey, supabaseUrl } from "./info";
import { getSessionTokens } from "../sessionStorage";

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Garante que o cliente singleton tem a sessao do usuario aplicada.
 * Chamar antes de qualquer query que dependa de RLS.
 *
 * Persistencia da sessao e' manual via appStorage (Capacitor Preferences
 * no iOS, localStorage no web) - ver AuthContext. Por isso desligamos
 * persistSession/autoRefresh/detectSessionInUrl no createClient.
 */
export async function ensureSession(): Promise<void> {
  const { accessToken, refreshToken } = await getSessionTokens();
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.warn("[ensureSession] Failed to set session:", error.message);
    }
  }
}
