import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "./AuthLayout";

interface AuthScreenProps {
  onGoToSignUp: () => void;
  onGoToForgotPassword: () => void;
}

export function AuthScreen({
  onGoToSignUp,
  onGoToForgotPassword,
}: AuthScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Entrar">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            disabled={submitting}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 mt-1" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="default"
          disabled={submitting || !email || !password}
          className="mt-2"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </Button>

        <div className="flex items-center justify-between mt-2 text-sm">
          <button
            type="button"
            onClick={onGoToForgotPassword}
            className="text-farm-primary hover:text-farm-primary-dark underline-offset-2 hover:underline"
            disabled={submitting}
          >
            Esqueci Minha Senha
          </button>
          <button
            type="button"
            onClick={onGoToSignUp}
            className="text-farm-primary hover:text-farm-primary-dark underline-offset-2 hover:underline"
            disabled={submitting}
          >
            Criar Conta
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
