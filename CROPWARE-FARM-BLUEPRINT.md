# Cropware Farm — Blueprint de Bootstrap

> Documento de partida para criar **Cropware Farm** como projeto separado, reaproveitando
> ao máximo a arquitetura, padrões e lições do Cropware (CDM) atual.
>
> **Lido como:** referência técnica autossuficiente — alguém (ou um Claude futuro) deve
> conseguir bootstrapar o Farm lendo só este documento, sem precisar reexplorar o repo
> Cropware original.
>
> **Status:** rascunho de fundação. Decisões marcadas com `[DECIDIR]` precisam de
> alinhamento antes do PR1.

---

## 1. Visão & Posicionamento

**O que é:** ferramenta de gestão financeira e administrativa para fazendas. Loop central:
lançar despesa/receita por foto ou texto via WhatsApp/web → ver consolidado em tabela →
ver dashboard → conversar com bot sobre as finanças.

**Para quem:** fazendeiro / produtor rural / gerente de fazenda. **Não é** o
público técnico-comercial (GD/DM) do Cropware CDM. Persona, vocabulário, UX e copy
são distintos.

**Diferencial defensável:** foto + WhatsApp + zero planilha. Vence "mais um sistema com
tela cheia de campo" se o usuário conseguir mandar foto do canhoto/boleto/cupom pelo
celular e o app entender, persistir e linkar à fazenda dele.

**O que NÃO é:**
- ERP financeiro full (não compete com Aegro/Agropos no escopo todo).
- Software de gestão de campo (Cropware Field já é).
- Software para revenda/canal técnico (Cropware CDM já é).

**Marca:** no piloto, "Cropware Farm" — marca filha. Quando se desacoplar com
tração validada, decidir entre manter "by Cropware" ou rebrandar.

---

## 2. Decisões arquiteturais (resumo)

| Decisão | Escolha | Motivo |
|---|---|---|
| Repo | **Novo, separado** (`cropware-farm/`) | Reset de complexidade. App principal já está pesado. |
| Projeto Supabase | **Novo** (`cropware-farm` no painel) | RLS limpo, billing isolado, sem colisão de tabelas, sem risco em produção CDM. |
| Bucket R2 | **Novo** (`cropware-farm-storage`) | Isolamento de blobs + custos rastreáveis. |
| WhatsApp Business | **Novo número** quando lançar publicamente; reaproveita conta META existente | PNID filter garante coexistência. |
| Bot Telegram | **Novo bot** (`@CropwareFarmBot` ou similar) | Identidade própria. |
| iOS bundle id | `br.com.cropware.farm` | Novo app na App Store. |
| Auth provider | **Mesma stack Supabase Auth** | Padrão dominado, MFA TOTP, password reset funcionando. |
| Billing | **Mesma stack**: Mercado Pago (web) + RevenueCat (iOS) | Webhooks já modelados, replicáveis. |
| LLM provider | **OpenAI no piloto** (mesmo do Cropware) + **Gemini Vision** para OCR (mesmo do receipt-scanner) | Reuso direto de prompts/handlers. Avaliar Anthropic em V3+ para custo/latência. |

**Princípio mestre:** Farm é "Cropware-DNA com identidade própria". Padrões = mesmos.
Schema, copy, persona, branding = novos.

---

> ### Como usar este blueprint + repo Cropware como biblioteca
>
> Tudo aqui assume que você (ou o Claude rodando na nova pasta `cropware-farm/`) tem
> **acesso de leitura ao repositório Cropware atual**
> (sugestão: clonar/mover pra `../cropware/` — sibling do novo repo, caminho relativo
> simples). Sempre que algo já existe lá e cabe no Farm —
> **busque, copie e adapte. Não reescreva do zero.**
>
> O apêndice (seção 15) lista os arquivos relevantes com paths exatos. Quatro categorias:
>
> **Copiar quase como está** (mudar imports/nomes, nada mais):
> - 56 componentes shadcn/ui em `src/components/ui/`
> - Wrappers de plugin Capacitor: `src/utils/platform.ts`, `appStorage.ts`,
>   `deviceCamera.ts`, `deviceGeolocation.ts`, `deviceFilePicker.ts`, `connectivity.ts`
> - `src/utils/lazyWithRetry.ts`, `src/components/ErrorBoundary.tsx`
> - `src/utils/sessionStorage.ts`, `src/utils/formatters.ts`
> - `ios/App/App/Info.plist` (substituir privacy strings pra contexto Farm)
> - `src/components/PWAUpdater.tsx`
> - Migrations Supabase de extensions/utilitários (vault, pg_cron setup)
>
> **Copiar e adaptar** (estrutura serve, conteúdo muda):
> - `src/contexts/AuthContext.tsx` (remover `appAccess` multi-módulo; manter sessão/refresh/MFA)
> - Telas de auth: `AuthScreen.tsx`, `SignUpScreen.tsx`, `ResetPasswordScreen.tsx`,
>   `MFASetupWizard.tsx`, `MFAVerifyScreen.tsx` (mudar copy, simplificar campos)
> - `src/utils/supabase/client.ts` + `info.ts` (apontar pro projeto Supabase novo)
> - Edge function skeleton (Hono router) — copiar de `make-server-875c00b5/index.ts`,
>   ficar só com auth/users/billing, jogar fora handlers CDM
> - `src/lib/revenuecat.ts` (manter API; trocar API key + product IDs)
> - `src/components/IOSAccountInfoScreen.tsx` (manter padrão IAP-only)
> - Webhooks MP e RevenueCat (mesmo contrato, persistir no schema novo)
> - Wrapper `fetch` com refresh/retry (procurar em `src/utils/api*` ou no AuthContext)
> - `src/main.tsx` (manter sequência de boot StatusBar + RevenueCat + `.native-ios`)
> - `src/app.css` (manter estrutura Tailwind v4 `@theme`; trocar paleta pra Farm)
>
> **Referência apenas — escrever do zero:**
> - Schema das tabelas (`farm_*` é domínio novo)
> - System prompts do bot (persona fazendeiro, não GD/DM)
> - Copy de UI, paleta de cores, identidade visual
> - Módulo `receipts/` (POC do `ReceiptScanner.tsx` serve de inspiração — mas
>   estrutura modular nova com persistência, tabela, mobile cards, filtros)
>
> **NÃO copiar:**
> - Módulos de domínio CDM: `src/laudos/`, `src/components/calculators/`,
>   `src/components/radar/`, `src/components/reports/`, NDVI, `PlantingManagement`,
>   `ProtocolManagement`, `TrialsManagement`, `GDAnalysisDashboard`, `SalesTracking`,
>   `ChecklistsView`, `FormsView`, etc.
> - Prompts/tools do bot técnico-comercial (`telegram-ai.tsx` SYSTEM_PROMPT_STATIC,
>   30+ tools de protocolo/visita/equipe)
> - `MainAppHorizontalLayout.tsx` (2197 linhas, monolítico — Farm faz `AppShell`
>   enxuto do zero seguindo o mesmo padrão visual)
>
> **Em dúvida:** abre o arquivo no Cropware, lê, adapta pro Farm. O que está dominado
> e funcionando não merece ser reinventado.

---

## 3. Stack & versões (espelhar Cropware)

```jsonc
// package.json — dependências críticas
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.x",                 // pinnar versão exata
    "@supabase/supabase-js": "^2.49.8",
    "@capacitor/core": "^8.3.0",
    "@capacitor/ios": "^8.3.0",
    "@capacitor/status-bar": "^7.0.6",
    "@capacitor/camera": "^8.0.2",
    "@capacitor/geolocation": "^8.2.0",
    "@capacitor/preferences": "^8.0.1",
    "@capacitor/network": "^8.0.1",
    "@capawesome/capacitor-file-picker": "^8.0.2",
    "@revenuecat/purchases-capacitor": "^x",    // copiar do Cropware
    "@fontsource-variable/inter-tight": "^5.2.7",
    "sonner": "^x",                             // toasts
    "lucide-react": "^x",                       // ícones (NÃO emoji)
    "tailwind-merge": "^x",
    "class-variance-authority": "^x",
    // Radix UI primitives — copiar do Cropware (~30 pacotes)
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^6.3.5",
    "@vitejs/plugin-react-swc": "^3.10.2",
    "@tailwindcss/vite": "^4.1.8",
    "vite-plugin-pwa": "^1.2.0",
    "tailwindcss": "^4.1.8"
    // ESLint + Prettier — NOVO (Cropware não tem; adicionar é melhoria)
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy:edge": "npx supabase functions deploy farm-api --no-verify-jwt --project-ref <FARM_PROJECT_REF>",
    "ios:open": "npx cap open ios",
    "ios:sync": "npx cap sync ios",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

**Configs base (copiar do Cropware, ajustar nomes):**
- `tsconfig.json`: ESNext + react-jsx + path alias `@/* → ./src/*`. **Subir o rigor:**
  `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Cropware é
  `strict: false`; Farm começa apertado, vale a disciplina enquanto codebase é pequeno.
- `vite.config.ts`: SWC plugin, PWA plugin, Tailwind plugin, alias `@`, `outDir: "build"`,
  esbuild `drop: ['debugger']` + `pure: ['console.log']`.

---

## 4. Estrutura de pastas

Padrão modular (espelha `src/laudos/`, `src/components/calculators/`, `src/components/radar/`
do Cropware — separação `components/ + hooks/ + pages/ + utils/ + types.ts + constants.ts`):

```
cropware-farm/
├── src/
│   ├── App.tsx                      # router + lazyWithRetry + ErrorBoundary
│   ├── main.tsx
│   ├── app.css                      # Tailwind v4 @theme + tokens Farm
│   ├── components/
│   │   ├── ui/                      # shadcn — 56 arquivos copiados do Cropware
│   │   ├── Layout/
│   │   │   ├── AppShell.tsx         # sidebar + header + mobile drawer
│   │   │   └── BottomTabBar.tsx     # iOS-style tab bar (opcional)
│   │   ├── auth/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   ├── ResetPasswordScreen.tsx
│   │   │   ├── MFASetupWizard.tsx
│   │   │   └── MFAVerifyScreen.tsx
│   │   └── common/                  # EmptyState, KPICard, ConfirmDialog, etc.
│   ├── modules/
│   │   ├── receipts/                # PRIMEIRA feature — herdeiro do ReceiptScanner
│   │   │   ├── components/
│   │   │   │   ├── ReceiptsTable.tsx
│   │   │   │   ├── ReceiptsCards.tsx           # mobile
│   │   │   │   ├── ReceiptCaptureDialog.tsx
│   │   │   │   ├── ReceiptEditForm.tsx
│   │   │   │   └── ReceiptFiltersBar.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useReceipts.ts
│   │   │   │   └── useReceiptScanner.ts        # chama edge function
│   │   │   ├── pages/
│   │   │   │   └── ReceiptsPage.tsx
│   │   │   ├── utils/
│   │   │   │   ├── receiptCategories.ts
│   │   │   │   └── receiptFormatters.ts
│   │   │   ├── types.ts
│   │   │   └── constants.ts
│   │   ├── farms/                   # cadastro de fazendas (copiar leve de FarmManagement)
│   │   ├── dashboard/               # resumo financeiro inicial
│   │   ├── account/                 # MyProfile, Security, Billing, Integrations
│   │   └── admin/                   # impersonation, orgs (V3+, escondido inicialmente)
│   ├── contexts/
│   │   └── AuthContext.tsx          # adaptado, sem appAccess multi-módulo
│   ├── hooks/
│   │   ├── useIsMobile.ts
│   │   └── useCapacitor.ts
│   ├── utils/
│   │   ├── supabase/
│   │   │   ├── info.ts              # projectId + anonKey
│   │   │   └── client.ts            # singleton + ensureSession()
│   │   ├── sessionStorage.ts
│   │   ├── appStorage.ts            # wrapper Capacitor Preferences <> localStorage
│   │   ├── platform.ts              # isCapacitorIOS(), isNativeCapacitorApp()
│   │   ├── deviceCamera.ts          # pickDeviceImage()
│   │   ├── formatters.ts            # currency, date, cnpj
│   │   ├── api.ts                   # fetch wrapper com refresh + retry
│   │   └── lazyWithRetry.ts
│   └── lib/
│       ├── password-utils.ts
│       └── auth-error.ts
├── supabase/
│   ├── functions/
│   │   ├── farm-api/                # substituto do make-server-875c00b5
│   │   │   ├── index.ts             # Hono router (rotas finas; lógica em handlers/)
│   │   │   ├── handlers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── receipts.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── billing.ts
│   │   │   │   ├── whatsapp.ts
│   │   │   │   └── telegram.ts
│   │   │   ├── lib/
│   │   │   │   ├── supabaseAdmin.ts
│   │   │   │   ├── singleflight.ts  # getAuthUserOnce
│   │   │   │   ├── cors.ts
│   │   │   │   ├── cron.ts          # x-cron-secret guard
│   │   │   │   └── llm.ts           # OpenAI wrapper
│   │   │   └── prompts/
│   │   │       ├── botSystem.pt-br.ts        # persona fazendeiro
│   │   │       └── receiptOcr.pt-br.ts
│   │   └── receipt-scanner/         # copiar do Cropware; Gemini Vision
│   │       └── index.ts
│   └── migrations/
│       ├── 0001_init_orgs.sql
│       ├── 0002_init_users_meta.sql
│       ├── 0003_init_farms.sql
│       ├── 0004_init_receipts.sql
│       ├── 0005_init_categories.sql
│       ├── 0006_init_pg_cron.sql
│       └── 0007_init_audit_log.sql
├── public/
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── favicon.ico
├── ios/                              # gerado pelo Capacitor
├── capacitor.config.ts
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.* (opcional)      # Tailwind v4 vive em app.css via @theme
├── .eslintrc.json
├── .prettierrc
├── README.md
└── package.json
```

---

## 5. Identidade visual

### 5.1 Tokens base (Tailwind v4 em `src/app.css`)

> Paleta sugerida — **[DECIDIR]** com você. Sugestão inicial: contraste com o verde
> Cropware (`#3b9f73`), trazendo um verde mais "terra/colheita" + acentos quentes
> (amarelo trigo, marrom-cacau leve). Mantém família visual da casa sem confundir
> com o app CDM.

```css
/* src/app.css */
@import "tailwindcss";
@import "@fontsource-variable/inter-tight/wght.css";

@theme {
  --color-farm-green: #2f7d4e;          /* primária — verde campo */
  --color-farm-green-light: #4a9d6a;
  --color-farm-green-dark: #1f5e3a;
  --color-farm-wheat: #c89b5d;          /* acento — trigo/colheita */
  --color-farm-soil: #6b4423;           /* sólido — terra */
  --color-farm-cream: #f8f4ec;          /* fundo claro */
  --color-chumbo-800: #333333;
  --color-chumbo-900: #1a1a1a;

  /* shadcn vars — manter nomes, ajustar valores pra paleta Farm */
  --color-primary: var(--color-farm-green);
  --color-primary-foreground: #ffffff;
  --color-background: #ffffff;
  --color-foreground: #1a1a1a;
  --color-muted: #f3f4f6;
  --color-border: #e5e7eb;
  --color-destructive: #dc2626;
  /* ...etc */
}

:root {
  --font-ui: "Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif;
  font-family: var(--font-ui);
  font-size: 14px;                       /* base — regra Cropware */
}

.native-ios {
  --font-ui: -apple-system, BlinkMacSystemFont, sans-serif;
  /* iOS usa SF Pro nativo */
}
```

### 5.2 Regras visuais (herdadas do Cropware — **obrigatórias**)

- **Fonte base 14px**. Nunca 13px. Acima 16/18/20px para títulos.
- **Botões só com variants shadcn** (`default`, `outline`, `ghost`, `destructive`,
  `secondary`). Nunca botão custom HTML.
- **Sem emojis em branding público.** UI marketing, telas do app, copy comercial =
  ícones Lucide (`<DollarSign>`, `<Receipt>`, `<TrendingUp>`). Bot WhatsApp/Telegram
  pode usar emoji em mensagens (UX, não branding).
- **Sem caractere `·` (middot) em texto algum.** Sempre `-` como separador. PDF, UI,
  bot, site. Regra dura.
- **Fontes self-hosted via `@fontsource`.** Nunca Google Fonts CDN — quebra no iOS
  Capacitor com FOUT.

### 5.3 Componentes shadcn a copiar (56 arquivos de `src/components/ui/`)

`accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button,
calendar, card, carousel, chart, checkbox, collapsible, command, context-menu,
dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar,
multi-select, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider,
sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, use-mobile.ts, utils.ts`

Mais customizados:
`ConfirmActionDialog, DeleteConfirmationDialog, DiscardChangesDialog,
EmptyStateCard, ItemsCount, KPICard`.

---

## 6. Schema inicial Supabase (V1)

> **Regra dura**: toda `CREATE TABLE` no schema `public` precisa de `GRANT` explícito
> a partir de out/2026 — senão a Data API quebra com `42501`. Sempre criar tabela +
> RLS + GRANT no mesmo arquivo de migration.

### 6.1 `0001_init_orgs.sql`

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  type text not null default 'farm',           -- futuro-proof
  plan_code text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

alter table public.organizations enable row level security;

create policy "org members read own org" on public.organizations
  for select using (
    id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.organizations to authenticated;
```

### 6.2 `0002_init_users_meta.sql`

```sql
create table public.users_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  role text not null default 'owner',          -- owner | manager | viewer
  full_name text,
  phone text,
  cpf text,
  city text,
  state text,
  whatsapp_linked_at timestamptz,
  telegram_linked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users_meta enable row level security;

create policy "user reads own meta" on public.users_meta
  for select using (user_id = auth.uid());
create policy "user updates own meta" on public.users_meta
  for update using (user_id = auth.uid());

grant select, update on public.users_meta to authenticated;
```

### 6.3 `0003_init_farms.sql`

```sql
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  area_ha numeric(10,2),
  city text,
  state text,
  primary_crop text,
  notes text,
  created_at timestamptz default now()
);

alter table public.farms enable row level security;

create policy "farms scoped to org" on public.farms
  for all using (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

create index farms_org_idx on public.farms(organization_id);
grant select, insert, update, delete on public.farms to authenticated;
```

### 6.4 `0004_init_receipts.sql` — **A tabela central do V1**

```sql
create table public.farm_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  farm_id uuid references public.farms(id) on delete set null,

  -- Tipo & status
  doc_type text not null,                        -- nota_fiscal | cupom | recibo | pix | boleto | outro
  direction text not null default 'expense',     -- expense | income
  status text not null default 'a_pagar',        -- a_pagar | pago | a_receber | recebido | vencido | cancelado

  -- Valores & datas
  total_value numeric(14,2) not null,
  currency text not null default 'BRL',
  transaction_date date,
  due_date date,
  paid_date date,

  -- Parte
  vendor text,
  vendor_cnpj text,
  payment_method text,                           -- pix | cartao | boleto | dinheiro | transferencia

  -- Conteúdo
  description text,
  category text,                                 -- FK lógico a farm_categories.slug
  invoice_number text,
  notes text,

  -- Anexo (imagem original do recibo no R2)
  attachment_key text,                           -- ex: 'receipts/{org_id}/{yyyy-mm}/{id}.jpg'
  attachment_mime text,

  -- IA / OCR
  source text not null default 'manual',         -- manual | photo | whatsapp | telegram | csv
  ai_confidence numeric(3,2),                    -- 0.00 a 1.00
  ai_raw jsonb,                                  -- snapshot do que o modelo retornou

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index farm_receipts_org_date_idx on public.farm_receipts(organization_id, transaction_date desc);
create index farm_receipts_org_status_idx on public.farm_receipts(organization_id, status);
create index farm_receipts_org_due_idx on public.farm_receipts(organization_id, due_date)
  where due_date is not null;

alter table public.farm_receipts enable row level security;

create policy "receipts scoped to org" on public.farm_receipts
  for all using (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.farm_receipts to authenticated;

-- Trigger updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger farm_receipts_set_updated_at before update on public.farm_receipts
  for each row execute function public.tg_set_updated_at();
```

### 6.5 `0005_init_categories.sql`

```sql
create table public.farm_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,  -- null = preset global
  slug text not null,
  name text not null,
  color text,
  icon_lucide text,                              -- ex: 'fuel', 'wrench', 'sprout'
  direction text not null default 'expense',     -- expense | income
  is_preset boolean not null default false,
  created_at timestamptz default now(),
  unique (organization_id, slug)
);

alter table public.farm_categories enable row level security;

create policy "categories org or preset" on public.farm_categories
  for select using (
    is_preset = true
    or organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );
create policy "categories write own org" on public.farm_categories
  for insert with check (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.farm_categories to authenticated;

-- Seed de presets
insert into public.farm_categories (slug, name, direction, is_preset, icon_lucide) values
  ('combustivel', 'Combustível', 'expense', true, 'fuel'),
  ('defensivos', 'Defensivos', 'expense', true, 'spray-can'),
  ('sementes', 'Sementes', 'expense', true, 'sprout'),
  ('fertilizantes', 'Fertilizantes', 'expense', true, 'leaf'),
  ('manutencao', 'Manutenção', 'expense', true, 'wrench'),
  ('pecas', 'Peças', 'expense', true, 'cog'),
  ('frete', 'Frete', 'expense', true, 'truck'),
  ('servicos', 'Serviços', 'expense', true, 'briefcase'),
  ('alimentacao', 'Alimentação', 'expense', true, 'utensils'),
  ('arrendamento', 'Arrendamento', 'expense', true, 'home'),
  ('folha', 'Folha de pagamento', 'expense', true, 'users'),
  ('outros_despesa', 'Outros', 'expense', true, 'circle'),
  ('venda_graos', 'Venda de grãos', 'income', true, 'wheat'),
  ('venda_gado', 'Venda de gado', 'income', true, 'beef'),
  ('outros_receita', 'Outras receitas', 'income', true, 'circle');
```

### 6.6 `0006_init_pg_cron.sql` — marca vencidos diariamente

```sql
-- Pré-requisito: pg_cron habilitado no projeto + vault com 'farm_cron_secret' e URL da edge
select cron.schedule(
  'farm_mark_overdue',
  '0 6 * * *',                                   -- 06h UTC diário
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'farm_api_url'),
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'farm_cron_secret')
      ),
      body := jsonb_build_object('job', 'mark_overdue')
    );
  $$
);
```

> **Segredo nunca no `command`**. Sempre via `vault.decrypted_secrets`.

### 6.7 `0007_init_audit_log.sql` (opcional V1, recomendado)

```sql
create table public.farm_audit_log (
  id bigserial primary key,
  organization_id uuid,
  user_id uuid,
  entity text not null,                          -- 'receipt' | 'farm' | 'user_meta'
  entity_id uuid,
  action text not null,                          -- 'create' | 'update' | 'delete'
  diff jsonb,
  created_at timestamptz default now()
);

alter table public.farm_audit_log enable row level security;
create policy "audit read own org" on public.farm_audit_log
  for select using (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

grant select on public.farm_audit_log to authenticated;
```

---

## 7. Edge function `farm-api` (Hono)

### 7.1 Esqueleto

```ts
// supabase/functions/farm-api/index.ts
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

import { mountAuthRoutes } from "./handlers/auth.ts";
import { mountReceiptRoutes } from "./handlers/receipts.ts";
import { mountUserRoutes } from "./handlers/users.ts";
import { mountBillingRoutes } from "./handlers/billing.ts";
import { mountWhatsappRoutes } from "./handlers/whatsapp.ts";
import { mountTelegramRoutes } from "./handlers/telegram.ts";
import { mountCronRoutes } from "./handlers/cron.ts";

const app = new Hono().basePath("/farm-api");
app.use("*", cors());
app.use("*", logger());

app.get("/health", c => c.json({ ok: true, service: "farm-api" }));

mountAuthRoutes(app);
mountReceiptRoutes(app);
mountUserRoutes(app);
mountBillingRoutes(app);
mountWhatsappRoutes(app);
mountTelegramRoutes(app);
mountCronRoutes(app);

Deno.serve(app.fetch);
```

> **Deploy obrigatório com `--no-verify-jwt`** porque há webhooks públicos (MP/RC/WhatsApp/Telegram).
> Sem isso o CLI bloqueia com 401. Cada handler valida auth quando precisa.

### 7.2 Padrões obrigatórios

**Singleflight em `auth.admin.getUserById` (read-only):**

```ts
// lib/singleflight.ts
const inflight = new Map<string, Promise<any>>();

export async function getAuthUserOnce(supabaseAdmin: any, userId: string) {
  if (inflight.has(userId)) return inflight.get(userId)!;
  const p = supabaseAdmin.auth.admin.getUserById(userId)
    .finally(() => inflight.delete(userId));
  inflight.set(userId, p);
  return p;
}
```

Usar em handlers `GET /users/*`, `GET /receipts/*`. **Nunca** em `PUT /users/:id` (mutate).

**Cron secret guard:**

```ts
export function requireCronSecret(c) {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || c.req.header("x-cron-secret") !== secret) {
    return c.json({ error: "forbidden" }, 403);
  }
}
```

**PNID filter (camada handler) — desde dia 1, mesmo com 1 número só:**

```ts
const FARM_BOT_PHONE_ID = Deno.env.get("WHATSAPP_FARM_BOT_PNID")!;

export function isOurWhatsappWebhook(payload: any): boolean {
  const change = payload?.entry?.[0]?.changes?.[0];
  return change?.value?.metadata?.phone_number_id === FARM_BOT_PHONE_ID;
}
```

Aplicar **no endpoint** e **no handler interno**. Memória de incidente: sem isso, um bot
processa webhook do outro.

**Wrapper `fetch` no front com auto-refresh + retry** (`src/utils/api.ts`):

```ts
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `https://${projectId}.supabase.co/functions/v1/farm-api${path}`;
  const { accessToken, refreshToken } = await getSessionTokens();
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && refreshToken) {
    await ensureSession();
    return api<T>(path, init);                   // 1 retry
  }
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

### 7.3 Rotas mínimas V1

| Método | Rota | Função |
|---|---|---|
| GET | `/farm-api/health` | health |
| POST | `/farm-api/auth/signup` | signup com criação de org + users_meta + trial |
| GET | `/farm-api/auth/me` | user + org + role |
| GET | `/farm-api/receipts` | lista com filtros (period, status, category, search) |
| POST | `/farm-api/receipts` | criar |
| PATCH | `/farm-api/receipts/:id` | editar |
| DELETE | `/farm-api/receipts/:id` | excluir |
| POST | `/farm-api/receipts/scan` | proxy pro `receipt-scanner` + upload R2 + criar registro |
| GET | `/farm-api/farms` | listar |
| POST | `/farm-api/farms` | criar |
| GET | `/farm-api/categories` | presets + custom da org |
| POST | `/farm-api/categories` | criar custom |
| POST | `/farm-api/webhook/whatsapp` | webhook META |
| POST | `/farm-api/webhook/telegram` | webhook Telegram |
| POST | `/farm-api/webhook/mp` | webhook Mercado Pago |
| POST | `/farm-api/webhook/revenuecat` | webhook RC |
| POST | `/farm-api/cron/mark-overdue` | job diário (guard `x-cron-secret`) |

---

## 8. Auth & multi-tenancy

### 8.1 Fluxo simplificado vs. Cropware

O Cropware tem `appAccess` granular por módulo (`{field, calc, radar, farm, crm, money}`)
e roles complexos (`master | editor | viewer | individual | subscriber`). **Farm
começa simples:**

- 1 user = 1 organização (no piloto). Multi-user por fazenda só em V3+.
- Roles iniciais: `owner | manager | viewer`.
- Sem `appAccess` — usuário Farm tem acesso a tudo do Farm.

### 8.2 Signup

```ts
// handlers/auth.ts (resumo)
app.post("/auth/signup", async c => {
  const { email, password, fullName, farmName, phone, cpf } = await c.req.json();

  const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: false,
    user_metadata: { fullName, phone, cpf, source: "web" },
  });
  if (error) return c.json({ error: error.message }, 400);

  // Cria org + users_meta + trial 14 dias
  const { data: org } = await supabaseAdmin
    .from("organizations").insert({
      name: farmName,
      type: "farm",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
    }).select().single();

  await supabaseAdmin.from("users_meta").insert({
    user_id: u.user.id,
    organization_id: org.id,
    role: "owner",
    full_name: fullName,
    phone, cpf,
  });

  await supabaseAdmin.from("farms").insert({
    organization_id: org.id,
    name: farmName,
  });

  // Trigger email de confirmação
  await supabaseAdmin.auth.admin.generateLink({ type: "signup", email });
  return c.json({ ok: true, userId: u.user.id });
});
```

### 8.3 MFA TOTP (copiar padrão Cropware)

- `supabase.auth.mfa.enroll({ factorType: 'totp' })` → QR code → user escaneia
- `supabase.auth.mfa.challenge` → `supabase.auth.mfa.verify`
- Recovery codes gerados client-side (8 codes de 4 chars), salvos cifrados.
- **Recovery code armazenado em `appStorage` (Capacitor Preferences no iOS, localStorage no web)** —
  nunca depender de localStorage só, ele persiste entre uninstalls no WKWebView e dá falsos positivos.

### 8.4 Multi-fazenda no futuro

Quando V3+ precisar de "usuário X gerencia 2 fazendas":
- Cria tabela `organization_memberships(user_id, organization_id, role)`.
- Substitui o FK direto `users_meta.organization_id` por consulta nessa tabela.
- RLS passa a usar `organization_id in (select organization_id from memberships where user_id = auth.uid())`.

Já deixar essa **forma** de policy desde V1 (mesmo que `users_meta.organization_id` seja
1:1 no piloto) economiza refactor depois.

---

## 9. WhatsApp + IA + ReceiptScanner evoluído

### 9.1 Pipeline foto → receipt persistido

```
[user] tira foto no WhatsApp / app
   │
   ▼
[webhook] POST /farm-api/webhook/whatsapp  ← PNID filter aqui
   │
   ▼
[handler] baixa mídia → upload R2 (`receipts/{org}/{yyyy-mm}/{uuid}.jpg`)
   │
   ▼
[chama edge `receipt-scanner` com base64]
   │
   ▼
[Gemini Vision retorna JSON estruturado]
   │
   ▼
[handler] cria `farm_receipts` com source='whatsapp', ai_confidence, ai_raw
   │
   ▼
[bot responde]: "R$ 150 em Combustível no Posto Vale, dia 17/05. Confirma? [Sim/Corrigir]"
   │
   ▼
[user clica Sim] → status fica 'pago' por default; senão abre fluxo de correção via texto.
```

### 9.2 System prompt do bot (persona fazendeiro)

Arquivo: `supabase/functions/farm-api/prompts/botSystem.pt-br.ts`

```
Você é o assistente financeiro do Cropware Farm. Fala português brasileiro,
tom direto e prático, como um gerente de fazenda experiente. Sem firulas, sem
jargão corporativo. Trata o usuário por "você", nunca "senhor/senhora".

Capacidades (tools):
- lancar_despesa(valor, fornecedor?, categoria?, data?, forma_pgto?, fazenda_id?)
- lancar_receita(valor, descricao, data?, fazenda_id?)
- listar_movimentos(periodo, tipo?, categoria?, status?)
- saldo_periodo(inicio, fim)
- boletos_pendentes(janela_dias?)
- registrar_pagamento(receipt_id, data_pagamento)

Regras:
- Se foto enviada, sempre processe e devolva os campos extraídos pedindo confirmação.
- Se texto ambíguo ("paguei a conta"), peça especificação antes de criar.
- Valores em R$ formatados pt-BR.
- Datas em DD/MM/AAAA na resposta; ISO no tool call.
- Quando confirmar criação, devolva os 3 campos críticos: valor, categoria, fornecedor/descrição.
- Nunca invente CNPJ ou número de NF. Se não veio na imagem, deixe nulo.
```

> Esse prompt **não é** o `SYSTEM_PROMPT_STATIC` do Cropware (que é técnico-comercial GD/DM).
> Tom novo, persona nova.

### 9.3 Provider de LLM

- **OpenAI no piloto** (mesmo padrão Cropware: `gpt-4.1-mini` ou modelo atual equivalente,
  via env `OPENAI_MODEL`). Reaproveita a função `callOpenAIWithFunctions()` adaptada.
- **Gemini para OCR** de recibo (mantém o `receipt-scanner` como está).
- Considerar Anthropic Claude (Sonnet 4.6/Haiku 4.5) em V3 — melhor custo/latência em
  tool use longo e mais robusto em pt-BR informal. Decisão de dados, não premature.

### 9.4 Linking WhatsApp/Telegram (mesmo padrão Cropware)

- App gera código de 6 dígitos válido 10 min via `POST /farm-api/integrations/generate-code`.
- User envia `/vincular 123456` no bot Farm.
- Backend valida → grava `users_meta.whatsapp_linked_at` + `whatsapp_phone`.
- A partir daí, mensagens daquele número viram intents desse user.

---

## 10. iOS Capacitor & PWA — playbook completo

### 10.1 `capacitor.config.ts`

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.cropware.farm",
  appName: "Cropware Farm",
  webDir: "build",
};

export default config;
```

> **Importante:** padrão Cropware é deixar config TS **minimalista**. Tudo de plugin
> (StatusBar, RevenueCat) é configurado em **runtime no `main.tsx`**, não declarativamente
> aqui. Mais flexível e mais fácil de debugar.

### 10.2 Sequência de boot — `main.tsx`

```ts
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { initRevenueCat } from "./lib/revenuecat";
import App from "./App";
import "./app.css";

const isNativeIOS =
  Capacitor.getPlatform() === "ios" && Capacitor.isNativePlatform();

if (isNativeIOS) {
  // Marca a árvore. CSS .native-ios troca fonte para SF Pro e ajusta safe-area.
  document.documentElement.classList.add("native-ios");
  document.body.classList.add("native-ios");

  // Status bar: webview NÃO sobrepõe a barra — essencial pra sticky headers
  // não ficarem atrás da hora do iOS. (memória `feedback_ios_safe_area`)
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#2f7d4e" }).catch(() => {});

  // RevenueCat: configura SDK no boot. No-op fora do iOS nativo.
  initRevenueCat().catch(err => console.warn("[RevenueCat] init failed", err));
}

createRoot(document.getElementById("root")!).render(<App />);
```

### 10.3 Wrappers de plugin (padrão obrigatório)

Toda chamada a plugin Capacitor passa por um **wrapper em `src/utils/device*.ts`** com
fallback web. Componentes **nunca** chamam `Camera.getPhoto()`, `Geolocation.getCurrentPosition()`
direto — só o wrapper. Razão: o mesmo código roda no browser, no PWA e no app nativo;
isolar o `if (isNativeCapacitorApp())` em um lugar é o que evita ramo morto espalhado.

Copiar do Cropware atual (caminhos em `src/utils/`):

| Arquivo | O que faz | Fallback web |
|---|---|---|
| `platform.ts` | `isNativeCapacitorApp()`, `isCapacitorIOS()` | — (base) |
| `appStorage.ts` | `getStoredValue/setStoredValue/removeStoredValue` + JSON variants | `localStorage` |
| `deviceCamera.ts` | `pickDeviceImage({ quality, promptLabel* })` retorna `File` | retorna `null` no web; UI usa `<input type="file">` |
| `deviceGeolocation.ts` | `getDeviceCurrentPosition()` com permission check antes | `navigator.geolocation` |
| `deviceFilePicker.ts` | anexos não-imagem (PDF, etc.) | `<input type="file">` |
| `connectivity.ts` | online/offline + tipo de conexão | `navigator.onLine` |

**Detalhes do `deviceCamera.ts`** (fluxo robusto que o Cropware usa hoje):

1. Tenta `Camera.getPhoto({ source: CameraSource.Prompt })` — abre menu nativo iOS (câmera ou galeria).
2. Se falhar (ex: simulador sem câmera), faz fallback pra `CameraSource.Photos`.
3. Se ainda falhar, cai pro `@capawesome/capacitor-file-picker`.
4. Sempre detecta cancelamento (`isCancelledError`) e propaga — não confunde "user cancelou" com "deu erro".
5. Retorna `File` (não base64) — pronto pra upload via `FormData` ou conversão pra blob.

**`appStorage.ts` — detalhe crítico:** quando salva no `Preferences` (nativo), também
limpa o `localStorage` equivalente. Sem isso, dá pra ficar com 2 versões do mesmo
dado e a do localStorage "vencer" em situações esquisitas. Manter o padrão.

### 10.4 `Info.plist` — permissões e flags

Localização: `ios/App/App/Info.plist`. Strings de privacidade são **obrigatórias** —
sem elas o app crasha quando o usuário toca em "Tirar foto" e a Apple rejeita o build
na review.

Cópia adaptada pra Farm (substituir o `Info.plist` gerado pelo Capacitor):

```xml
<!-- ===== Privacy strings (obrigatórias para Apple review) ===== -->
<key>NSCameraUsageDescription</key>
<string>O Cropware Farm usa a câmera para fotografar recibos, notas e documentos da fazenda.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>O Cropware Farm usa sua biblioteca para anexar fotos de recibos e documentos.</string>

<!-- Só inclua se REALMENTE for usar geolocalização. Apple cobra justificativa. -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>O Cropware Farm pode usar sua localização para vincular despesas à fazenda mais próxima.</string>

<!-- ===== Comportamento da UI ===== -->
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
<!-- precisa true pro StatusBar plugin controlar estilo via JS no main.tsx -->

<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>

<!-- ===== Compliance ===== -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
<!-- declara que o app só usa criptografia exempt (HTTPS padrão).
     Sem isso, todo build de TestFlight pede questionário de export compliance. -->
```

### 10.5 Apple IAP — regra **inegociável**

**Política da Apple:** apps que vendem assinaturas/conteúdo digital no iOS DEVEM usar
**StoreKit (IAP)**. Levar usuário pra pagar em checkout web (Mercado Pago, Stripe etc.)
= **rejeição automática** na review. Isso é vivido e dominado no Cropware atual — herdar.

**Arquitetura dual de billing:**

| Plataforma | Provider | Webhook |
|---|---|---|
| Web / PWA / Android | Mercado Pago | `/farm-api/webhook/mp` |
| iOS nativo | RevenueCat (encapsula StoreKit) | `/farm-api/webhook/revenuecat` |

**Setup técnico:**

1. **Pacote:** `@revenuecat/purchases-capacitor`.
2. **Wrapper:** criar `src/lib/revenuecat.ts` (espelha o do Cropware) exportando:
   ```ts
   export function isRevenueCatSupported(): boolean      // true só em iOS nativo
   export async function initRevenueCat(): Promise<void> // configurar API key no boot
   export async function identifyRevenueCatUser(userId: string): Promise<void>
   export async function logoutRevenueCatUser(): Promise<void>
   export async function getOfferings(): Promise<...>     // lista produtos disponíveis
   export async function purchaseProduct(id: string): Promise<...>
   export async function restorePurchases(): Promise<...>
   ```
3. **API key:** `VITE_REVENUECAT_IOS_KEY` no `.env`.
4. **AuthContext sincroniza identidade:**
   - Quando `user.id` muda → `identifyRevenueCatUser(user.id)`.
   - No signout → `logoutRevenueCatUser()`.
   - Padrão pronto em `cropware/src/contexts/AuthContext.tsx:199-204`.
5. **Tela separada pra iOS:** criar `src/modules/account/IOSAccountScreen.tsx`. No iOS,
   o portal de conta exibe esta tela em vez de `MyAccountPortalScreen` (que mostraria
   links Mercado Pago — proibido pela Apple). Esta tela:
   - Mostra status atual via `Purchases.getCustomerInfo()`.
   - Botões "Assinar mensal / anual" chamam `Purchases.purchaseProduct(productId)`.
   - Botão "Restaurar compras" chama `Purchases.restorePurchases()`.
   - **Não menciona nem linka Mercado Pago, nem o site, nem preço fora do App Store** (Apple cobra esse policiamento).
6. **Webhook RevenueCat → backend:** `POST /farm-api/webhook/revenuecat` valida assinatura,
   atualiza `auth.users.user_metadata.billing` com:
   ```json
   {
     "subscriptionStatus": "active|expired|grace_period|...",
     "subscriptionExpiresAt": "2026-06-19T...",
     "subscriptionSource": "ios_iap",
     "productIdentifier": "farm_pro_monthly"
   }
   ```
7. **Front trata `subscriptionSource: "ios_iap"`** como caso especial — esconder UI
   de "Gerenciar pagamento" (no iOS, só pelo Settings > Apple ID > Subscriptions).

**App Store Connect:**

- Bundle id `br.com.cropware.farm` registrado no Apple Developer.
- Subscription Group criado no App Store Connect (ex: "Cropware Farm Pro").
- Produtos: `farm_pro_monthly`, `farm_pro_yearly`. Preços por país.
- Mapear os mesmos product IDs no painel RevenueCat (Offerings).
- Sandbox testers no App Store Connect pra testar IAP sem cobrar de verdade.
- **Privacy Policy URL + EULA** obrigatórios — Apple exige link no App Store Connect.

### 10.6 Splash screen & ícones

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — substituir os ~18 ícones. Usar
  gerador (icon.kitchen, MakeAppIcon, ou figma export).
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` — editar no Xcode pra logo Farm
  sobre fundo `#2f7d4e` ou `#f8f4ec`. Keep simple — Apple rejeita splash com
  "loading" / "splash" text.
- PWA: `public/pwa-192x192.png` + `public/pwa-512x512.png` (maskable).

### 10.7 Build pipeline iOS

```bash
# 1. Build web
npm run build                           # gera ./build/

# 2. Sincronizar para iOS
npx cap sync ios                        # copia build/ + atualiza Pods

# 3. Abrir no Xcode
npx cap open ios

# 4. No Xcode:
#    - Selecionar team / signing & capabilities
#    - Bump Marketing Version (CFBundleShortVersionString)
#    - Bump Build (CFBundleVersion)
#    - Product > Archive
#    - Distribute App > App Store Connect > Upload
#    - Submeter pra review no App Store Connect
```

Scripts `package.json` sugeridos:

```json
{
  "ios:build": "npm run build && npx cap sync ios",
  "ios:open": "npm run ios:build && npx cap open ios"
}
```

### 10.8 PWA (`vite.config.ts`)

```ts
VitePWA({
  registerType: "prompt",
  manifest: {
    name: "Cropware Farm",
    short_name: "Farm",
    description: "Gestão financeira da sua fazenda no celular.",
    theme_color: "#2f7d4e",
    background_color: "#f8f4ec",
    display: "standalone",
    start_url: "/",
    icons: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  },
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Cachear chamadas à edge function (mas com networkFirst — dados financeiros)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "farm-api",
          networkTimeoutSeconds: 5,
        },
      },
      // R2 / Storage — staleWhileRevalidate (imagens de recibos)
      {
        urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com\/.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "farm-storage",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
})
```

`PWAUpdater.tsx`: componente que detecta nova versão do SW, mostra toast "Nova versão
disponível — atualizar?" com `registration.waiting?.postMessage({ type: 'SKIP_WAITING' })`.
Copiar do Cropware (`src/components/PWAUpdater.tsx`).

### 10.9 Armadilhas conhecidas da WKWebView iOS

Lista consolidada de problemas já enfrentados no Cropware — todos com solução estabelecida:

| Problema | Causa | Solução |
|---|---|---|
| Header sticky fica atrás da barra de hora do iOS | `env(safe-area-inset-top)` não funciona em sticky no WKWebView | `StatusBar.setOverlaysWebView({ overlay: false })` no boot (já no `main.tsx`) |
| `localStorage` persiste entre desinstalações | iOS preserva storage do WKWebView | `useState(defaultSafe)` em tabs sensíveis (billing/admin); usar `appStorage` (Preferences) pro resto |
| FOUT — texto pisca sem fonte | Google Fonts CDN é lento/bloqueado | `@fontsource-variable/inter-tight` empacotado no bundle |
| Câmera não funciona no simulador | Simulador iOS não tem câmera | Fallback pra `CameraSource.Photos` (`deviceCamera.ts` já trata) |
| `fetch("blob:...")` falha após `Camera.getPhoto` | Bug em algumas versões | Usar `resultType: CameraResultType.Uri` + `fetch(photo.webPath)` |
| App "trava" no push de URL externa | WKWebView abre dentro do app | `App.addListener('appUrlOpen')` + `Browser.open(url)` pra abrir externamente |
| Build do TestFlight pede compliance toda vez | Faltando flag de criptografia | `ITSAppUsesNonExemptEncryption: false` no `Info.plist` |
| Status bar fica preta sobre fundo escuro | Estilo padrão | `StatusBar.setStyle({ style: Style.Light })` no boot |
| Push notifications | Não usado no piloto Farm | Para V3+ avaliar `@capacitor/push-notifications` + APNs cert no Apple Developer |
| Tela de billing redireciona pro MP e Apple rejeita | Violação da App Store Review Guideline 3.1.1 | Tela `IOSAccountScreen` separada usando RevenueCat/StoreKit; **zero menção a MP/web** |
| App carrega em branco no iOS após `npm run build` | `webDir` errado ou esqueceu `cap sync` | Confirmar `webDir: "build"` no `capacitor.config.ts` + sempre `cap sync ios` antes de buildar no Xcode |

### 10.10 O que NÃO usar (ainda)

- **Push notifications:** complexidade alta (APNs cert, entitlements), valor baixo no V1.
  WhatsApp já cobre notificação. Avaliar em V3+.
- **Deep linking / Universal Links:** só vale quando tiver fluxo "abre app do
  WhatsApp/email". Adia.
- **Background fetch / sync:** Capacitor não tem suporte robusto sem plugin custom.
  Confiar em pull-to-refresh + sync explícito no foreground.
- **App Clips:** sem ROI no piloto.

---

## 11. Anti-padrões — NÃO repetir do Cropware

Lista de erros já cometidos no Cropware. Cada um custou tempo. Não repetir.

| Não fazer | Por quê | O que fazer |
|---|---|---|
| Usar `·` (middot) em texto | Decisão estética dura. PDF, UI, site, bot. | Sempre `-`. |
| Salvar imagem em base64 dentro de JSONB | Engorda DB, quebra cache, lento | Upload para R2/Storage; salvar só a `key`. |
| Paged.js / html2canvas / jsPDF client-side pra PDF | Já testado, virou gambiarra | `window.print()` simples; server-side só se realmente precisar. |
| Google Fonts CDN no iOS | FOUT garantido no WKWebView | `@fontsource` empacotado. |
| `CREATE TABLE` sem `GRANT` explícito | Quebra com `42501` a partir de out/2026 | Sempre tabela + RLS + GRANT no mesmo SQL. |
| `env(safe-area-inset-*)` em sticky no iOS Capacitor | Não funciona | Plugin `@capacitor/status-bar` com `overlays:false`. |
| Deploy edge function sem `--no-verify-jwt` em webhooks | CLI bloqueia 401 | Sempre `--no-verify-jwt` quando há webhook público. |
| `localStorage` como source-of-truth pra tab ativa em billing/admin | WKWebView persiste entre uninstalls | `useState(default)` sempre; restaurar só em rotas inócuas. |
| Secret de cron literal no `command` do `pg_cron` | Vaza em logs/inspect | `vault.decrypted_secrets`. |
| Múltiplos chips WhatsApp na mesma WABA sem filtro PNID | Um bot processa webhook do outro | Filtro em 2 camadas (endpoint + handler). |
| `auth.admin.getUserById` paralelo em handler read-only | GoTrue derrete em rajadas | `getAuthUserOnce` singleflight. |
| Carregar relatório inteiro pra listagem | Pisca "vazio" enquanto carrega 50KB JSON | Narrow SELECT + lazy + `hasLoaded` em vez de `loading`. |
| Emoji em branding público | Padrão de marca | Ícones Lucide. (Bot WhatsApp/Telegram pode usar emoji em UX.) |
| Botão custom HTML em vez de shadcn variant | Quebra consistência | Sempre `<Button variant="...">`. |
| Font 13px | Padrão Cropware é 14 | Body 14, títulos 16/18/20. |

---

## 12. Roadmap V1 → V6

### V1 — Loop mínimo (2-4 semanas)

**Objetivo:** usuário consegue lançar despesa por foto/texto/web e ver na tabela.

- Schema `0001-0005` + bucket R2 `cropware-farm-storage`.
- Auth completo (signup + login + MFA opcional + reset).
- Tela `/receipts` com:
  - Tabela desktop / cards mobile.
  - Filtros: período, status, categoria, busca.
  - "Capturar recibo" → camera/upload → preview de extração Gemini → edição → salvar.
- WhatsApp intent: foto → confirma 3 campos → salva.
- Dashboard mini: total entradas, saídas, saldo do período.
- Export Excel (porta o `ExcelExport` do Cropware).

### V2 — Vencimentos & vínculos (3-4 semanas)

- Status `vencido` via job pg_cron diário (`0006_init_pg_cron`).
- Card "boletos vencendo nos próximos 7 dias" no dashboard.
- Push WhatsApp proativo: "tem boleto vencendo amanhã".
- Vincular despesa a `farm_id` (FarmManagement light).
- Categorias custom por org (CRUD em `/categories`).
- Recorrências (combustível mensal, energia, internet) — geração automática.

### V3 — Inteligência básica (1-2 meses)

- "Quanto gastei esse mês com defensivos?" via WhatsApp.
- Resumo semanal automático (job sextas 18h): top 3 categorias, variação vs semana anterior.
- Detecção de duplicidades: 2 recibos iguais em < 24h pede confirmação.
- Conciliação manual: upload de extrato bancário PDF/OFX, Gemini extrai linhas, user concilia.

### V4 — Open Finance (3-4 meses)

- Integração Pluggy ou Belvo (sair do MVP) — extrato bancário automático.
- Auto-categorização aprendida por usuário (modelo simples baseado em regras + LLM fallback).
- Previsão de saldo no fim do mês (forecast por categoria).

### V5 — Apuração & contabilidade (3+ meses)

- Apuração por safra / cultura / talhão.
- Exportação contábil (XML / SPED simplificado / Excel padronizado pro contador).
- Lucratividade por hectare por cultura.
- Compartilhar com contador (acesso limitado read-only).

### V6 — Maturidade (timing dependente)

- Multi-fazenda por usuário (memberships).
- Multi-usuário por fazenda (gerente + funcionário).
- App nativo iOS completo (não só Capacitor).
- Integrações: ERP local, NF-e API, cooperativas regionais.
- Cropware Money (reativar) para canal técnico-comercial — produto irmão.

---

## 13. Checklist de bootstrap (primeiros 10 commits)

> Ordem proposta. Cada item = 1 commit ou PR pequeno.
>
> **Em qualquer item abaixo**, se houver arquivo equivalente no repo Cropware
> (sibling em `../cropware/`), **busque e copie/adapte** em vez de reescrever do
> zero — categorias e paths exatos no apêndice (seção 15) e na nota após seção 2.

- [ ] **Commit 1 — Init.** `package.json` + `tsconfig.json` (strict) + `vite.config.ts`
      + `.gitignore` + `.eslintrc.json` + `.prettierrc` + `README.md` mínimo.
- [ ] **Commit 2 — Tailwind v4 + tokens.** `src/app.css` com `@theme` Farm; importa
      `@fontsource-variable/inter-tight`. Smoke test com 1 botão `<Button>` shadcn.
- [ ] **Commit 3 — shadcn/ui.** Copia 56 components de `cropware/src/components/ui/`.
      Roda `npm run dev` e confirma 0 erros de import.
- [ ] **Commit 4 — Supabase project + migrations 0001-0005.** Cria projeto novo no painel.
      Aplica migrations. `info.ts` aponta pra projectId novo. RLS testado manualmente
      com 2 users distintos.
- [ ] **Commit 5 — AuthContext + client.** `AuthContext.tsx`, `client.ts`, `info.ts`,
      `sessionStorage.ts`. Telas `AuthScreen` + `SignUpScreen` + `ResetPasswordScreen`.
- [ ] **Commit 6 — Layout + router.** `App.tsx` com BrowserRouter + lazy retry +
      ErrorBoundary. `AppShell` (sidebar + header + mobile drawer).
- [ ] **Commit 7 — Edge function `farm-api`.** Hono skeleton + `/health`. Deploy com
      `--no-verify-jwt`. `api.ts` wrapper no front.
- [ ] **Commit 8 — Edge function `receipt-scanner`.** Copia do Cropware. Smoke test
      com 1 imagem real.
- [ ] **Commit 9 — Módulo `receipts` V1.** Página + tabela/cards + filtros + dialog de
      captura + edição. Integra com `receipt-scanner` via `farm-api`. R2 upload da
      imagem original.
- [ ] **Commit 10 — Capacitor + PWA.** `capacitor.config.ts` + manifest + Status bar
      plugin. `npx cap add ios`. Build no Xcode pra device real e valida safe-area.

A partir daí: dashboard V1, WhatsApp intent, billing MP, trial expiry job.

---

## 14. Decisões pendentes — preciso de você antes do PR1

- **[DECIDIR]** Paleta final do Farm. A sugestão `#2f7d4e` + trigo + terra é só
  ponto de partida. Se preferir outra direção, define antes do commit 2.
- **[DECIDIR]** Nome no app store / domínio. Mantemos `cropware.farm` ou variação?
- **[DECIDIR]** Bot Telegram: nome do bot e handle. Bot WhatsApp: número novo desde
  já ou usa o do Cropware com PNID separado?
- **[DECIDIR]** Trial: 14 dias (mesmo do CDM) ou outro período? Plano único ou
  já 2 tiers no lançamento?
- **[DECIDIR]** RevenueCat: novo app na conta ou app separado? Influencia o billing
  do iOS.
- **[DECIDIR]** Repositório: público ou privado? Quem tem acesso?
- **[DECIDIR]** CI/CD: GitHub Actions desde já ou só deploy manual no piloto?

---

## 15. Apêndice — referências dentro do Cropware atual

> Atalhos pra você ou eu encontrar rapidamente o "como foi feito" original.
>
> **Repo Cropware:** assumido como sibling do `cropware-farm/` — paths relativos do
> tipo `../cropware/...`. Se estiver em outro lugar, ajusta o prefixo.
>
> **Como usar esta tabela:** sempre que o blueprint mencionar um padrão
> ("singleflight", "wrapper de Camera", "RLS pattern", "boot do StatusBar"), procure
> o arquivo aqui, **abra no Cropware, leia, copie/adapte**. Não reescreva do zero
> o que está dominado.
>
> Categorias do que pode ser copiado **como está** vs **adaptado** vs **só
> referência** estão na nota logo após a seção 2.

| Tópico | Local no Cropware |
|---|---|
| Tokens Tailwind v4 + fontes | `src/app.css` |
| shadcn/ui base | `src/components/ui/` (56 arquivos) |
| Lazy retry + ErrorBoundary | `src/App.tsx:53-133` |
| AuthContext completo | `src/contexts/AuthContext.tsx` |
| Supabase client singleton | `src/utils/supabase/client.ts` |
| ReceiptScanner POC | `src/components/ReceiptScanner.tsx` + `supabase/functions/receipt-scanner/index.ts` |
| Edge function Hono router | `supabase/functions/make-server-875c00b5/index.ts` |
| Singleflight | `supabase/functions/make-server-875c00b5/index.ts:7196-7208` |
| PNID filter WhatsApp | `supabase/functions/make-server-875c00b5/whatsapp-leads-bot.tsx:521` |
| R2 storage upload | `supabase/functions/make-server-875c00b5/r2_storage.tsx` |
| Snapshot data URL → R2 | `src/laudos/utils/snapshotUpload.ts` |
| Capacitor config | `capacitor.config.ts` |
| Boot sequence iOS (StatusBar + RevenueCat + .native-ios) | `src/main.tsx` |
| Detecção de plataforma | `src/utils/platform.ts` |
| Storage abstraído (Preferences ↔ localStorage) | `src/utils/appStorage.ts` |
| Camera + FilePicker fallback | `src/utils/deviceCamera.ts` |
| Geolocation + permissions | `src/utils/deviceGeolocation.ts` |
| Connectivity (online/offline) | `src/utils/connectivity.ts` |
| File picker (anexos) | `src/utils/deviceFilePicker.ts` |
| RevenueCat wrapper | `src/lib/revenuecat.ts` (Cropware) |
| Tela de conta iOS (IAP-only) | `src/components/IOSAccountInfoScreen.tsx` |
| Info.plist (privacy strings + flags) | `ios/App/App/Info.plist` |
| PWA config | `vite.config.ts` (VitePWA block) |
| PWA updater (toast de nova versão) | `src/components/PWAUpdater.tsx` |
| MFA wizard | `src/components/MFASetupWizard.tsx` + `MFAVerifyScreen.tsx` |
| MP billing | `supabase/functions/make-server-875c00b5/index.ts:3219+` |
| RevenueCat webhook | `supabase/functions/make-server-875c00b5/revenuecat-webhook.tsx` |
| RevenueCat identify/logout no AuthContext | `src/contexts/AuthContext.tsx:199-204` |
| Telegram link account | `src/components/TelegramLinkAccount.tsx` |
| WhatsApp generate link code | `src/components/IntegrationsManagement.tsx` |
| Categorias agro no scanner | `supabase/functions/receipt-scanner/index.ts` (SYSTEM_PROMPT) |

---

## 16. Setup do ambiente Claude Code no novo repo

Aproveitar tudo o que já está dominado no Cropware passa também por configurar o
ambiente Claude Code do `cropware-farm/` desde o primeiro dia. Esta seção é o
"depois de `mkdir cropware-farm && cd cropware-farm`, faça isto."

### 16.1 Primeira sessão Claude no repo novo — sequência

```bash
# 1. Criar repo
mkdir -p ../cropware-farm
cd ../cropware-farm
git init

# 2. Copiar este blueprint pra raiz do repo novo
cp ../cropware/CROPWARE-FARM-BLUEPRINT.md .

# 3. Abrir Claude Code aqui dentro
# (depois, dentro do Claude:)
```

Dentro da sessão, **primeiro turno** com o Claude:

> "Leia `CROPWARE-FARM-BLUEPRINT.md` inteiro. Vamos começar pelo commit 1 da
> seção 13. O repo Cropware atual está em `../cropware/` — use como biblioteca
> conforme indicado na nota após a seção 2."

### 16.2 Skills do Claude Code a usar

| Skill | Quando usar | Por quê |
|---|---|---|
| `/init` | **No commit 1**, logo após o primeiro `npm install` | Gera `CLAUDE.md` com convenções do projeto. Referencia este blueprint como anexo principal. |
| `/review` | A cada PR antes de merge | Revisão estruturada do diff antes do merge. |
| `/security-review` | Antes de cada PR que toca auth, billing, webhooks ou RLS | Segurança vale verificar duas vezes em código financeiro. |
| `/simplify` | Quando bater 200+ linhas em um arquivo novo | Forçar disciplina de tamanho desde o início. |
| `/fewer-permission-prompts` | Depois de 1-2 dias de uso | Reduz fricção de aprovação de comandos repetitivos. |
| `/update-config` | Setup inicial de hooks (se quiser auto-format/lint) | Configurar `.claude/settings.json` do projeto. |
| `/ultrareview` | Antes de release importante (V1 launch, primeiro beta) | Review multi-agente do branch inteiro. |

### 16.3 MCP servers — configurar antes do commit 4

Dois são essenciais; os outros que você já tem disponíveis podem ficar como estão.

**Essencial — Supabase MCP (no novo projeto Supabase):**
- Permite ao Claude listar tabelas, aplicar migrations, ler advisors, ver logs de
  edge functions, listar deploys, gerar tipos TS do schema — **sem você precisar
  copiar/colar SQL**.
- Quando criar o projeto Supabase Farm no painel, adicionar o token MCP ao Claude
  Code (configuração do MCP server Supabase já é familiar — mesma stack do Cropware).
- A partir do commit 4 (Supabase project + migrations), o Claude pode aplicar as
  migrations direto via `apply_migration`, validar com `get_advisors`, ver erro em
  `get_logs`.

**Essencial — Context7:**
- Já disponível. Use para buscar docs atualizados de React 18, Vite 6, Tailwind v4,
  Capacitor 8, Supabase JS, RevenueCat — em vez de WebSearch genérico ou confiar em
  conhecimento desatualizado.
- Particularmente importante: **Tailwind v4** mudou bastante e knowledge cutoff de
  modelos pode estar desatualizado. Idem Vite 6.

**Opcional — Figma MCP:**
- Se for desenhar telas do Farm no Figma antes de codar, o servidor permite
  importar specs direto. Útil pro Receipts table + dashboard cards. Não obrigatório.

**Não precisa configurar:** Canva, Meta Ads, Windsor, ZipRecruiter, Google Drive —
não há fit pro Farm.

### 16.4 Subagentes do Claude — quando chamar

| Agente | Caso de uso típico no Farm |
|---|---|
| `Explore` | "Como o Cropware faz X?" → busca em `../cropware/` rápido sem inflar contexto principal. |
| `Plan` | Desenhar PR maior (V2 vencimentos, V3 conciliação extrato). |
| `general-purpose` | Tarefa multi-passo com escrita/edição (ex: gerar todas as migrations 0001-0007 + RLS + GRANT). |
| `claude-code-guide` | Dúvida sobre o próprio Claude Code (hooks, MCP, skills). |

Regra: tarefa que envolve **leitura larga em `../cropware/`** → quase sempre
delegar pro `Explore` pra não estourar contexto principal.

### 16.5 Memória do usuário — migração

Sua memória atual está em
`/Users/leonardoterra/.claude/projects/-Users-leonardoterra-Documents-New-project-cropware/memory/`.

Memórias específicas do **diretório** Cropware **não** são carregadas automaticamente
no diretório `cropware-farm/`. Mas a maioria delas **continua aplicável** ao Farm
porque codificam padrões da casa (visual, deploy, iOS, Supabase, etc.).

**Fazer no commit 1 do Farm** (ou primeira sessão Claude no repo novo):

```bash
# Copiar memórias da casa pro projeto novo
mkdir -p /Users/leonardoterra/.claude/projects/-Users-leonardoterra-Documents-New-project-cropware-farm/memory
cp /Users/leonardoterra/.claude/projects/-Users-leonardoterra-Documents-New-project-cropware/memory/*.md \
   /Users/leonardoterra/.claude/projects/-Users-leonardoterra-Documents-New-project-cropware-farm/memory/
```

> O nome exato do diretório de memória depende do path do repo Farm — Claude Code
> deriva dele substituindo `/` por `-`. Confirmar o nome real após primeira sessão
> Claude no repo novo.

**Depois de copiar, revisar:**

| Memória | Ação |
|---|---|
| `project_positioning.md` | **Reescrever do zero.** Cropware = técnico-comercial CDM. Farm = fazendeiro. Filtros invertem. |
| `project_laudo_timbrado_colors.md` | **Apagar.** Laudos não existem no Farm. |
| `feedback_laudos_storage_for_blobs.md` | **Generalizar.** Princípio "blobs no Storage, nunca base64 em JSONB" vale; tirar referência específica a laudos. |
| `feedback_laudos_narrow_select.md` | **Generalizar.** Princípio "narrow SELECT + lazy + `hasLoaded`" vale; tirar laudos. |
| `project_compute_disk_io.md` | **Reescrever.** Compute do Cropware ≠ compute do Farm (projetos Supabase diferentes). |
| Todas as outras (visual, no-emoji, no-middot, deploy edge, iOS safe area, fontes, routing trap, GRANT, marketing pages, PNID, vault secrets, singleflight, PDF strategy) | **Manter como está.** Padrões de casa aplicáveis. |

`MEMORY.md` (índice) também precisa ser editado pra refletir as mudanças.

### 16.6 Arquivos `.md` mínimos na raiz do `cropware-farm/`

| Arquivo | Conteúdo | Quando criar |
|---|---|---|
| `CROPWARE-FARM-BLUEPRINT.md` | Este documento, copiado para raiz | Commit 1 |
| `CLAUDE.md` | Gerado por `/init`. Referencia o blueprint como anexo principal de contexto. | Commit 1, logo após `/init` |
| `README.md` | Setup local (`npm install`, `npm run dev`, link pro Supabase project). Curto. | Commit 1 |
| `CHANGELOG.md` | Opcional. Útil quando começar a versionar releases iOS. | A partir do primeiro TestFlight |
| `.agent/workflows/*.md` | Padrões repetitivos que você quiser fixar (ex: "como criar uma nova migration", "como adicionar uma nova rota na edge function"). | À medida que padrões emergem |

**`CLAUDE.md` deve conter** (após `/init`, adicionar manualmente):

```markdown
# Cropware Farm

> Para arquitetura completa, padrões herdados do Cropware CDM, schema, anti-padrões
> e roadmap, ler [CROPWARE-FARM-BLUEPRINT.md](./CROPWARE-FARM-BLUEPRINT.md).

## Repo de referência
Cropware (CDM) está em `../cropware/`. Use como biblioteca conforme indicado na
seção 2 do blueprint. Categorias de copy/adapt/reescrever/não-copiar estão lá.

## Comandos comuns
- `npm run dev` — dev server
- `npm run build` — build web
- `npm run ios:open` — sync iOS e abrir Xcode
- `npm run deploy:edge` — deploy farm-api (sempre com --no-verify-jwt; já configurado)

## Onde buscar coisas
- Padrão Hono / Singleflight / PNID filter: `../cropware/supabase/functions/make-server-875c00b5/`
- Wrappers Capacitor: `../cropware/src/utils/{platform,appStorage,deviceCamera,...}.ts`
- shadcn/ui base: `../cropware/src/components/ui/`
- AuthContext / MFA / RevenueCat: `../cropware/src/contexts/AuthContext.tsx` + `src/lib/revenuecat.ts`
```

### 16.7 Hooks (opcional, recomendado depois da V1 estabilizar)

Quando o codebase começar a crescer, vale configurar via `/update-config`:
- Hook `PreToolUse` em `Write|Edit` que roda `prettier --write` no arquivo após edição.
- Hook `Stop` que roda `tsc --noEmit` rápido pra pegar erro de tipo antes de mostrar
  "feito" pro usuário.

Não fazer no commit 1 — adia até ter base sólida.

---

**FIM DO BLUEPRINT.** Para iniciar o projeto, ler do topo até o final, marcar
as `[DECIDIR]` (seção 14), e abrir o repo novo seguindo o checklist (seção 13) +
o setup de ambiente Claude (seção 16).
