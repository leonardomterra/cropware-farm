import { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SignUpScreen } from "@/components/auth/SignUpScreen";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";
import { Button } from "@/components/ui/button";

type AuthView = "login" | "signup" | "forgot";

function AuthFlow() {
  const [view, setView] = useState<AuthView>("login");

  if (view === "signup") {
    return <SignUpScreen onGoToLogin={() => setView("login")} />;
  }
  if (view === "forgot") {
    return <ForgotPasswordScreen onGoToLogin={() => setView("login")} />;
  }
  return (
    <AuthScreen
      onGoToSignUp={() => setView("signup")}
      onGoToForgotPassword={() => setView("forgot")}
    />
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-farm-cream flex items-center justify-center">
      <p className="text-farm-soil text-sm">Carregando...</p>
    </main>
  );
}

function AuthenticatedHome() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <main className="min-h-screen bg-farm-cream p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-farm-green-dark">
              Cropware Farm
            </h1>
            <p className="text-sm text-farm-soil">{user.organizationName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sair
          </Button>
        </header>

        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-1">
            Ola, {user.fullName.split(" ")[0] || "fazendeiro"}.
          </h2>
          <p className="text-sm text-slate-500">
            Sua conta foi criada com sucesso. As proximas funcionalidades
            (lancamento de despesas, dashboard, integracao WhatsApp) vem nos
            commits 6 a 9.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-farm-cream rounded p-3">
              <p className="text-slate-500">Role</p>
              <p className="font-medium text-slate-900">{user.role}</p>
            </div>
            <div className="bg-farm-cream rounded p-3">
              <p className="text-slate-500">Trial termina</p>
              <p className="font-medium text-slate-900">
                {user.trialEndsAt
                  ? new Date(user.trialEndsAt).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function RootRoutes() {
  const { user, loading, isResettingPassword, resetError } = useAuth();

  if (loading) return <LoadingScreen />;
  if (isResettingPassword || resetError) return <ResetPasswordScreen />;
  if (user) return <AuthenticatedHome />;
  return <AuthFlow />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootRoutes />
    </AuthProvider>
  );
}
