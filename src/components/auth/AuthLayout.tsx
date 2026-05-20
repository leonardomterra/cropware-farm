import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="text-farm-primary h-7 w-auto" />
          <p className="text-sm text-slate-500 mt-2">A fazenda no celular.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-1">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
          ) : (
            <div className="mb-4" />
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
