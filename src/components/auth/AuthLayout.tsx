import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-farm-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-farm-green-dark">
            Cropware Farm
          </h1>
          <p className="text-sm text-farm-soil mt-1">A fazenda no celular.</p>
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
