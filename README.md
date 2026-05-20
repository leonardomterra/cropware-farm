# Cropware Farm

Gestao financeira e administrativa para fazendas - parte do ecossistema Cropware.

> Para arquitetura completa, padroes herdados do Cropware CDM, schema, anti-padroes
> e roadmap V1-V6, ler [CROPWARE-FARM-BLUEPRINT.md](./CROPWARE-FARM-BLUEPRINT.md).

## Setup

```bash
npm install
npm run dev
```

Dev server roda em `http://localhost:3000`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite dev server com HMR |
| `npm run build` | Build de producao em `build/` |
| `npm run preview` | Preview do build local |
| `npm run typecheck` | `tsc --noEmit` - valida tipos sem emitir JS |
| `npm run lint` | ESLint em todo o projeto |
| `npm run format` | Prettier write em todos os arquivos suportados |

## Repo de referencia

O Cropware CDM (repositorio irmao) esta em `../cropware/` e serve como biblioteca
de padroes. Conforme indicado na secao 2 do blueprint, categorias de copy / adapt /
referencia / nao-copiar guiam o reuso entre os dois projetos.

## Stack

- React 18 + TypeScript 5 (`strict: true`)
- Vite 6 com plugin SWC
- Tailwind v4 - adicionado no commit 2
- shadcn/ui + Radix - adicionado no commit 3
- Supabase (auth, storage, edge functions, postgres) - adicionado no commit 4+
- Capacitor 8 (iOS) - adicionado no commit 10
