import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/utils/supabase/client";
import {
  clearSessionTokens,
  getSessionTokens,
  persistSessionTokens,
} from "@/utils/sessionStorage";

export interface FarmUser {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "manager" | "viewer";
  organizationId: string;
  organizationName: string;
  trialEndsAt: string | null;
  planCode: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  farmName: string;
  phone?: string;
  cpf?: string;
}

interface AuthContextType {
  user: FarmUser | null;
  loading: boolean;
  isResettingPassword: boolean;
  resetError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  completePasswordReset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(
  userId: string,
  email: string,
): Promise<FarmUser | null> {
  const { data, error } = await supabase
    .from("users_meta")
    .select(
      `user_id, role, full_name, organization_id, organizations:organization_id ( id, name, trial_ends_at, plan_code )`,
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.warn("[fetchUserProfile] failed:", error?.message);
    return null;
  }

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;
  if (!org) {
    console.warn("[fetchUserProfile] user has no organization linked");
    return null;
  }

  return {
    id: userId,
    email,
    fullName: data.full_name ?? "",
    role: (data.role ?? "owner") as FarmUser["role"],
    organizationId: org.id,
    organizationName: org.name,
    trialEndsAt: org.trial_ends_at ?? null,
    planCode: org.plan_code ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarmUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        // URL hash: password recovery, errors
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const type = hashParams.get("type");
        const accessTokenFromUrl = hashParams.get("access_token");
        const refreshTokenFromUrl = hashParams.get("refresh_token");
        const errorParam = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        if (errorParam) {
          let msg = "Erro ao redefinir senha.";
          if (
            errorParam === "access_denied" ||
            errorDescription?.includes("expired")
          ) {
            msg = "O link de recuperacao expirou ou e invalido. Solicite um novo.";
          } else if (errorDescription) {
            msg = decodeURIComponent(errorDescription.replace(/\+/g, " "));
          }
          setResetError(msg);
          window.location.hash = "";
          setLoading(false);
          return;
        }

        if (
          type === "recovery" &&
          accessTokenFromUrl &&
          refreshTokenFromUrl
        ) {
          // Aplica a sessao de recuperacao no client pra permitir updateUser
          await supabase.auth.setSession({
            access_token: accessTokenFromUrl,
            refresh_token: refreshTokenFromUrl,
          });
          setIsResettingPassword(true);
          window.location.hash = "";
          setLoading(false);
          return;
        }

        // Sessao persistida
        const { accessToken, refreshToken } = await getSessionTokens();
        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session || !data.user) {
          await clearSessionTokens();
          setLoading(false);
          return;
        }

        const profile = await fetchUserProfile(
          data.user.id,
          data.user.email ?? "",
        );
        if (profile) {
          setUser(profile);
          await persistSessionTokens(
            data.session.access_token,
            data.session.refresh_token,
            data.session.expires_at ?? null,
          );
        } else {
          await clearSessionTokens();
        }
      } catch (err) {
        console.error("[AuthContext.init] failure:", err);
        await clearSessionTokens();
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session || !data.user) {
      throw new Error(translateAuthError(error?.message));
    }

    await persistSessionTokens(
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at ?? null,
    );

    const profile = await fetchUserProfile(data.user.id, data.user.email ?? "");
    if (!profile) {
      throw new Error(
        "Sua conta esta sem fazenda vinculada. Contate o suporte.",
      );
    }
    setUser(profile);
  }, []);

  const signUp = useCallback(
    async (input: SignUpInput): Promise<{ needsConfirmation: boolean }> => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            farm_signup: true,
            full_name: input.fullName,
            farm_name: input.farmName,
            phone: input.phone?.replace(/\D/g, "") || undefined,
            cpf: input.cpf?.replace(/\D/g, "") || undefined,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      // Supabase retorna identities vazio quando email ja existe
      if (data.user?.identities && data.user.identities.length === 0) {
        throw new Error("Este e-mail ja esta cadastrado.");
      }

      // Quando email confirmation esta ON (default), session vem null
      // ate o user clicar no link de confirmacao
      const needsConfirmation = !data.session;
      if (data.session && data.user) {
        await persistSessionTokens(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_at ?? null,
        );
        const profile = await fetchUserProfile(
          data.user.id,
          data.user.email ?? "",
        );
        if (profile) setUser(profile);
      }
      return { needsConfirmation };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await clearSessionTokens();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  }, []);

  const completePasswordReset = useCallback(() => {
    setIsResettingPassword(false);
    setResetError(null);
    window.location.hash = "";
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isResettingPassword,
        resetError,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        completePasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function translateAuthError(message: string | undefined): string {
  if (!message) return "Erro desconhecido.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Este e-mail ja esta cadastrado.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um minuto.";
  if (m.includes("password should be at least"))
    return "A senha deve ter ao menos 6 caracteres.";
  return message;
}
