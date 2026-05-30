/**
 * Breadcrumb full-width abaixo da tab bar - espelho do CDM
 * (`<div id="breadcrumb-portal">` em MainAppHorizontalLayout.tsx).
 *
 * Estilo: bg-white, border-b slate-200, container max-w-1600, py-2,
 * fonte 14px weight 300 letter-spacing 0.2px. Primeiro segmento em
 * slate-400 (prefixo do app), separadores em slate-400, ultimo segmento
 * em slate-600 weight 400.
 *
 * Uso: renderizado automaticamente no AppShell logo abaixo da tab bar.
 * Recebe os segmentos ja prontos (ex: ["Cropware Farm", "Lancamentos"]).
 */
interface PageBreadcrumbProps {
  segments: string[];
}

export function PageBreadcrumb({ segments }: PageBreadcrumbProps) {
  if (segments.length === 0) return null;
  const [prefix, ...rest] = segments;

  return (
    <div className="bg-white border-b border-slate-200">
      <div
        className="max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
        style={{ fontSize: "14px", fontWeight: 300, letterSpacing: "0.2px" }}
      >
        <span style={{ color: "#94a3b8" }}>{prefix}</span>
        {rest.map((segment, i) => {
          const isLast = i === rest.length - 1;
          return (
            <span
              key={i}
              className="flex items-center gap-1.5 shrink-0 last:shrink last:min-w-0 last:truncate"
            >
              <span style={{ color: "#94a3b8" }}>›</span>
              <span
                className={isLast ? "truncate" : ""}
                style={{
                  color: isLast ? "#475569" : "#94a3b8",
                  fontWeight: isLast ? 400 : 300,
                }}
              >
                {segment}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
