# Cropware Design System — guia completo (Field → Farm)

**Data:** 2026-05-26
**Origem:** Cropware Field (`c:\Cropware\cropware`)
**Destino:** Cropware Farm

Este documento compila TODOS os padrões visuais do Cropware Field pra reutilização no Farm.
A **única mudança planejada** pro Farm é a **paleta brand**: trocar verde (#3b9f73) por slate no
header e em elementos brand. Cores semânticas (emerald=sucesso, amber=warning, red=erro,
blue=info) permanecem iguais. Ver seção [Tema Farm — o que muda](#tema-farm--o-que-muda) no final.

---

## Índice

1. [Stack e setup](#stack-e-setup)
2. [Tokens fundamentais](#tokens-fundamentais)
3. [Tipografia](#tipografia)
4. [Componentes UI base](#componentes-ui-base)
5. [Header, sub-header e navegação](#header-sub-header-e-navegação)
6. [Tabs principais e secundárias](#tabs-principais-e-secundárias)
7. [Padrões de tela / listagem](#padrões-de-tela--listagem)
8. [Filter bar](#filter-bar)
9. [Toolbar de ações (hierarquia de botões)](#toolbar-de-ações-hierarquia-de-botões)
10. [Cards](#cards)
11. [Badges](#badges)
12. [Dialogs e modais](#dialogs-e-modais)
13. [Banners informativos](#banners-informativos)
14. [Feedback (toast, loading, empty state)](#feedback-toast-loading-empty-state)
15. [Splash screen e logo](#splash-screen-e-logo)
16. [Mobile patterns](#mobile-patterns)
17. [Regras críticas (NUNCA fazer)](#regras-críticas-nunca-fazer)
18. [Tema Farm — o que muda](#tema-farm--o-que-muda)

---

## Stack e setup

- **Framework:** React 18 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Componentes base:** shadcn/ui (Radix UI primitives)
- **Ícones:** `lucide-react`
- **Toast:** `sonner`
- **PWA:** `vite-plugin-pwa`
- **Mobile:** Capacitor 8 (iOS)
- **Fonts:** `@fontsource-variable/inter-tight`, `@fontsource-variable/montserrat`, `@fontsource/alumni-sans`

---

## Tokens fundamentais

### Paleta brand atual (Field)

```css
/* src/app.css @theme */
--color-cropware-dark: #064e3b;
--color-cropware-orange: #f59e0b;
--color-cropware-green: #3b9f73;          /* brand primary */
--color-cropware-green-light: #48b583;    /* gradient stop, sub-header */
--color-cropware-green-dark: #2d8060;
--color-chumbo-800: #333333;
--color-chumbo-900: #1a1a1a;
```

### shadcn tokens (não mudar — base do sistema)

```css
--primary: 158 47% 43%;                    /* HSL = brand green */
--background: 0 0% 100%;                   /* white */
--foreground: 222.2 84% 4.9%;              /* slate-950 */
--muted: 210 40% 96.1%;                    /* slate-50 */
--muted-foreground: 240 3.8% 66.1%;        /* zinc-400 #a1a1aa */
--border: 214.3 31.8% 91.4%;               /* slate-200 */
--input: 214.3 31.8% 91.4%;
--ring: 213 27% 84%;
--destructive: 0 84.2% 60.2%;              /* red-500 */
--radius: 4px;
```

### Paleta semântica (NÃO MUDAR no Farm)

| Uso | Cor | Tailwind |
|---|---|---|
| Sucesso / "Anexada" | Emerald | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| Warning / "Pendente" | Amber | `bg-amber-50 text-amber-700 border-amber-200` |
| Erro / "Descartada" | Red | `bg-red-50 text-red-700 border-red-200` |
| Info | Blue | `bg-blue-50 text-blue-700 border-blue-200` |
| Neutro / "Arquivada" | Slate | `bg-slate-100 text-slate-600 border-slate-200` |

### Radius

```css
--radius: 4px;
--radius-sm: 2px;  /* calc(var(--radius) - 2px) */
--radius-md: 4px;  /* var(--radius) */
--radius-lg: 6px;  /* calc(var(--radius) + 2px) */
--radius-xl: 8px;  /* calc(var(--radius) + 4px) */
```

Tailwind: usar `rounded` (padrão = 4px) na maioria; `rounded-lg` (6px) em cards e dialogs;
`rounded-full` apenas em pílulas (trial badge).

---

## Tipografia

### Família base

```css
--font-ui: "Geist Variable", "Geist", ui-sans-serif, system-ui, sans-serif, ...;
```

iOS nativo sobrescreve com SF Pro:
```css
.native-ios { --font-ui: -apple-system, "SF Pro Text", ...; }
```

### Body

```css
body {
  font-family: var(--font-ui) !important;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.015em;
  -webkit-font-smoothing: antialiased;
}
.native-ios body { letter-spacing: -0.02em; }
```

### Mobile input zoom prevention (CRÍTICO)

iOS faz zoom automático se font-size < 16px no input. Workaround:
```css
@media (max-width: 768px) {
  input, textarea, select, [data-slot="input"], [data-slot="textarea"], [data-slot="command-input"] {
    font-size: 16px !important;
  }
  input::placeholder, textarea::placeholder, [data-slot="command-input"]::placeholder {
    font-size: 16px !important;
  }
}
```

### Badges (padronização global)

Override global aplica em **TODOS** os `[data-slot="badge"]`:
```css
[data-slot="badge"] {
  font-family: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
}
```

### Logo subtitle

"Farm Data. Smart Decisions." usa **Alumni Sans 800 + letter-spacing 3px UPPERCASE**:
```tsx
fontFamily: "'Alumni Sans', sans-serif"
fontSize: '13px'
fontWeight: 800
letterSpacing: '3px'
textTransform: 'uppercase'
```

### Escalas de fontes usadas (referência)

| Uso | Tamanho |
|---|---|
| Body / texto padrão | 14px |
| Texto secundário | 13px |
| Texto pequeno (legenda, info) | 12px |
| Texto micro (timestamp em thumb) | 10px |
| Header dialog title | 16px medium |
| Header dialog description | 13px normal |
| Nome usuário no header | 14px medium |
| Card title | 14px medium |
| Section title (h2) | 16-18px medium |

---

## Componentes UI base

### Button (`src/components/ui/button.tsx`)

**Variantes:**
```tsx
default      // brand primary (verde Field)
destructive  // red-500
outline      // btn-gradient-border text-slate-500
dark         // btn-dark-gradient text-white
secondary    // slate suave
ghost        // hover-only
link         // sublinhado
```

**Tamanhos:**
```tsx
default: "h-9 px-4 py-2"
sm:      "h-8 rounded px-3"
lg:      "h-10 rounded px-6"
icon:    "size-9 rounded"
```

**Classes custom (definidas em app.css):**
```css
.btn-dark-gradient {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  border: none !important;
  box-shadow: none !important;
}
.btn-dark-gradient:hover { background-color: #e2e8f0 !important; }
.btn-dark-gradient:active { background-color: #cbd5e1 !important; }

.btn-gradient-border {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  border: none !important;
  box-shadow: none !important;
}
.btn-gradient-border:hover { background-color: #e2e8f0 !important; }
.btn-gradient-border:active { background-color: #cbd5e1 !important; }
```

**Nota histórica:** apesar do nome "gradient", as classes hoje são **flat slate-100**. Mantém o nome
por compatibilidade com componentes existentes.

### Input (`src/components/ui/input.tsx`)

```tsx
className="h-9 w-full border border-slate-200 rounded px-3 py-1
           bg-white text-base md:text-sm
           shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
           focus-visible:border-ring
           placeholder:text-muted-foreground"
```

Padrão de uso em forms:
```tsx
<Input
  value={...}
  onChange={...}
  placeholder="Ex.: ..."
  className="bg-white h-9 text-sm"
  disabled={isViewOnly}
/>
```

Contador inline em input com `maxLength`:
```tsx
<div className="relative">
  <Input className="... pr-14" maxLength={24} ... />
  <span
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-normal"
    style={{ fontSize: '13px' }}
  >
    {value.length}/24
  </span>
</div>
```

### Card (`src/components/ui/card.tsx`)

```tsx
<Card>                                         // border-slate-200 rounded shadow-none, gap-6
  <CardHeader>                                 // px-6 pt-6, gap-1.5
    <CardTitle>                                // leading-none font-medium
    <CardDescription>                          // text-muted-foreground
    <CardAction>                               // right-aligned action slot
  </CardHeader>
  <CardContent>                                // px-6 [&:last-child]:pb-6
  <CardFooter>                                 // flex items-center px-6 pb-6
</Card>
```

**Card padrão Talhões (referência pra listagens):**
```tsx
<Card className="border-gray-200 hover:border-gray-300 rounded-lg shadow-none bg-white overflow-hidden transition-colors gap-1.5">
  <CardHeader className="!pb-0 pt-3 px-4 !gap-0.5">
    <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
      <span className="truncate flex-1 text-[14px] font-medium text-slate-600 font-condensed">
        {title}
      </span>
      <Badge variant="outline" className={badgeClasses}>
        {status}
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent className="!pb-2.5 !pt-0 px-4">
    <div className="space-y-1.5 text-sm">
      <div className="truncate">
        <span className="text-slate-500">Label: </span>
        <span className="text-slate-900">{value}</span>
      </div>
      {/* Botões flat com btn-gradient-border, h-9 */}
      <div className="flex gap-2 mt-3">
        <Button className="btn-gradient-border flex-1 h-9 px-3 ...">Ação</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Header, sub-header e navegação

### Header principal (Field — verde)

```tsx
<header className="shadow-none" style={{ backgroundColor: '#3b9f73' }}>
  <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-3 sm:py-4">

    {/* Desktop */}
    <div className="hidden md:flex items-center justify-between">
      <Logo className="h-12 w-auto" layout="horizontal" />

      <div className="flex items-center gap-3">
        {/* Nome do usuário */}
        <div className="flex flex-col items-end" style={{ gap: '1px' }}>
          <p className="text-white font-medium leading-none" style={{ fontSize: '14px' }}>
            {user.name}
          </p>
        </div>

        {/* App selector portal */}
        <div id="desktop-app-selector-portal"></div>

        {/* Botões glass: Help, Configurações, Sair */}
        <button
          className="inline-flex items-center gap-1.5 rounded h-8 px-3 transition-all duration-200 active:scale-95 font-normal text-[14px]"
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
        >
          <Settings className="size-3.5" />
          <span>Configurações</span>
        </button>
      </div>
    </div>

    {/* Mobile: 2 rows (logo+ações / app-selector full-width) */}
    <div className="flex md:hidden flex-col gap-2">
      ...
    </div>
  </div>
</header>
```

### Sub-header (status bar — verde claro)

```tsx
<div className="border-t" style={{ backgroundColor: '#44b584', borderTopColor: 'rgba(127, 211, 173, 0.45)' }}>
  <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-2">
    <div className="flex flex-col md:flex-row md:justify-end items-stretch md:items-center gap-2 badges-status-bar">
      {/* Badges: organização, online/offline, backup status, etc */}
    </div>
  </div>
</div>
```

Badges dentro do `.badges-status-bar` recebem styling especial via CSS:
```css
.badges-status-bar > * > [data-slot="badge"] {
  background-color: transparent !important;
  border-color: transparent !important;
  color: #ffffff !important;
  font-size: 12px !important;
}
@media (max-width: 767px) {
  .badges-status-bar > * { width: 100% !important; }
  .badges-status-bar > * > [data-slot="badge"] {
    width: 100% !important;
    justify-content: flex-start !important;
    padding-left: 0 !important;
  }
}
```

### Glass button (padrão pra botão em fundo colorido)

```tsx
style={{
  backgroundColor: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
}}
// hover:
backgroundColor: 'rgba(255,255,255,0.2)'
```

Aplica em: Settings, Sair, Help, qualquer botão sobre o header.

---

## Tabs principais e secundárias

### Barra de tabs principal (horizontal, abaixo do header)

```tsx
<div className="w-full overflow-x-auto no-scrollbar -mt-px relative z-50 hidden md:block"
     style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
  <div className="max-w-[1600px] w-full mx-auto px-0 flex h-12 items-stretch">
    {/* Cada NavItem em div className={navCellClass} (flex-1 basis-0 min-w-0) */}
  </div>
</div>
```

NavItem ativo (CSS classes em app.css):
```css
.tab-active-main {
  background-color: white;
}
.tab-active-main[data-state="active"] {
  background-color: #3b9f73 !important;     /* brand */
  color: white !important;
  border-color: #3b9f73 !important;
}
```

NavItem rendering:
```tsx
className={cn(
  "relative flex-1 basis-0 min-w-0 flex items-center justify-center gap-1.5 px-3 h-12 rounded-none whitespace-nowrap",
  isActive ? "..." : "..."
)}
```

### Tabs secundárias (dentro de uma tela)

```css
.cropware-active-secondary,
.tab-active-secondary[data-state="active"] {
  background-color: #44b584 !important;     /* verde claro */
  color: white !important;
  border-color: #44b584 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
```

Padrão de tab pills dentro de uma feature (ex: TrialManager):
```tsx
<button
  className={cn(
    "flex flex-1 items-center justify-center gap-2 h-9 px-3 rounded text-sm font-normal cursor-pointer transition-all duration-200",
    isActive ? "btn-dark-gradient text-white" : "btn-gradient-border text-slate-600"
  )}
>
  <Icon className="size-4 shrink-0" />
  Label
</button>
```

---

## Padrões de tela / listagem

### Layout padrão (ex: GD Ensaios, Talhões, etc)

```tsx
<div className="space-y-4">

  {/* 1. Banner informativo (opcional, contextual) */}
  <div className="flex items-start gap-1.5 px-1 font-normal text-slate-400"
       style={{ fontSize: '13px', lineHeight: '1.5' }}>
    <Info className="size-3.5 mt-0.5 shrink-0" />
    <span>Texto explicativo discreto sem card</span>
  </div>

  {/* 2. Toolbar (filtro esquerda + contador direita) */}
  <div className="flex items-center justify-between gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 flex items-center justify-center gap-1.5 px-3 rounded-md cursor-pointer transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 border-0"
                style={{ minWidth: 140 }}>
          <span className="text-sm font-condensed">{currentFilterLabel}</span>
          <ChevronDown className="size-3.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {/* Items */}
      </DropdownMenuContent>
    </DropdownMenu>
    <span className="text-sm text-slate-500 font-condensed">
      Mostrando {count} item{count === 1 ? '' : 's'}
    </span>
  </div>

  {/* 3. Listagem (grid de cards) */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>

  {/* 4. Empty state (quando vazio) */}
  <div className="text-center py-12 border border-zinc-200 rounded" style={{ backgroundColor: '#ffffff' }}>
    <p style={{ fontFamily: "'Inter Tight', sans-serif", color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
      Nenhum item
    </p>
    <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '2px 0 0 0' }}>
      Mensagem secundária / call-to-action
    </p>
  </div>
</div>
```

---

## Filter bar

Padrão de filtros multi-campo (Atividades, Plantios, etc):

```tsx
<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
  <div className="flex flex-wrap gap-2 items-center">
    {/* Inputs */}
    <Input className="bg-white h-9 text-sm" />
    {/* Botões de filtro */}
    <button className="rounded-lg bg-white border border-slate-200 hover:bg-slate-100 h-9 px-3">
      ...
    </button>
    {/* Estado ativo: bg-slate-100 font-medium (sem checkmark) */}
  </div>
</div>
```

**Regra:** opções em filtros sempre em **ordem alfabética**.

---

## Toolbar de ações (hierarquia de botões)

Padrão validado em GD Ensaios — hierarquia visual clara:

```tsx
{/* 1. Ação primária (criar/registrar) — flat escuro */}
<button className="h-9 px-3 bg-slate-700 text-white hover:bg-slate-800 border-0 shadow-none rounded text-sm">
  <Plus className="size-3.5" /> Criar
</button>

{/* 2. Ação utilitária (importar/exportar) — flat claro */}
<button className="h-9 px-3 bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 shadow-none rounded text-sm">
  <Download className="size-3.5" /> Exportar
</button>

{/* 3. Controle de visualização (grade/ordenação) — sem fundo */}
<button className="h-9 px-3 text-slate-500 hover:text-slate-700 rounded text-sm">
  <LayoutGrid className="size-4" />
</button>
```

Hierarquia: **escuro (criar) > slate-100 (utilitário) > ghost (visualização)**.

---

## Cards

### Card básico (já documentado em [Componentes UI base](#componentes-ui-base))

### Card de avaliação (TrialManager pattern)

Botões na base, sempre alinhados via `mt-auto`:
```tsx
<div className="flex items-center gap-2 shrink-0 flex-wrap justify-end mt-auto pt-3">
  {/* Botão "Preencher" — primary, com texto */}
  <button className="h-9 px-3 text-sm cursor-pointer flex items-center gap-1.5 ...">
    <Plus className="size-3.5" /> Preencher
  </button>

  {/* Botão "Editar" — outline contextual, com texto */}
  <button className="h-9 px-3 text-sm cursor-pointer flex items-center gap-1.5 ...">
    <Edit className="size-3.5" /> Editar
  </button>

  {/* Botão "Excluir" — icon-only, red */}
  <button className="h-9 w-9 flex items-center justify-center cursor-pointer ... text-red-600">
    <Trash2 className="size-4" />
  </button>
</div>
```

**Regra:** ações principais (criar/editar) sempre **ícone + texto**. Ações secundárias (excluir,
ver detalhes) podem ser icon-only se houver tooltip.

### Card de listagem com botões alinhados (TrialAnnotationsTab pattern)

Quando os cards tem conteúdo variável (descrição com tamanhos diferentes), use sempre as MESMAS
linhas estruturais (label/value) com fallback `-` pra manter altura uniforme:

```tsx
<div className="space-y-1.5 text-sm">
  <div className="truncate" title={description || ''}>
    <span className="text-slate-500">Observações: </span>
    <span className="text-slate-900">
      {description || <span className="italic text-slate-400">sem descrição</span>}
    </span>
  </div>
  {/* Localização sempre presente — placeholder `-` quando não houver. Alinha botões. */}
  <div className="truncate">
    <span className="text-slate-500">Localização: </span>
    {hasLocation ? (
      <a className="text-emerald-600 hover:underline">{lat}, {lng}</a>
    ) : (
      <span className="text-slate-400">-</span>
    )}
  </div>
</div>
```

---

## Badges

### Schema de cores (definidos em `src/components/ui/badge.tsx`)

```tsx
colorScheme:
  slate, amber, emerald, red, blue,
  green, orange, yellow, purple, cyan,
  teal, indigo, pink, rose, sky, lime,
  gray, white, none
```

Cada um aplica `bg-{cor}-50 text-{cor}-700 border-{cor}-200`.

**Mapeamento semântico oficial:**
```tsx
const STATUS_BADGES = {
  pending:   { label: 'Pendente',   classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  attached:  { label: 'Anexada',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived:  { label: 'Arquivada',  classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  discarded: { label: 'Descartada', classes: 'bg-red-50 text-red-700 border-red-200' },
};
```

### Sizes

```tsx
size: "default" (h-6) | "compact" (h-5)
```

Fonte sempre 12px (override global), mesmo em compact.

### Badge truncado

```tsx
<Badge truncate title="Texto longo completo" colorScheme="slate">
  Texto longo que precisa truncar...
</Badge>
```

Aplica `max-w-[260px] md:max-w-[420px]` e adiciona Tooltip com `title`.

### Badge sobre imagem (overlay)

```tsx
<Badge variant="outline"
       className={cn('shrink-0', badge.classes, 'backdrop-blur-sm bg-opacity-90')}
       style={{ fontSize: '10px', backdropFilter: 'blur(4px)' }}>
  Anexada
</Badge>
```

---

## Dialogs e modais

### Dialog comum (z-[2000])

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

<Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
  <DialogContent
    className="rounded-lg max-w-md"
    style={{ fontFamily: "'Inter Tight', sans-serif" }}
  >
    <DialogHeader>
      <DialogTitle className="font-medium" style={{ fontSize: '16px', color: '#0f172a' }}>
        Título
      </DialogTitle>
      <DialogDescription className="font-normal" style={{ fontSize: '13px', color: '#64748b' }}>
        Descrição complementar.
      </DialogDescription>
    </DialogHeader>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>
```

### AlertDialog (z-[10000])

Usar quando:
- Precisa de confirmação destrutiva
- Está sendo aberto DENTRO de outro AlertDialog (z-[2000] do Dialog comum fica atrás)

```tsx
import { ConfirmActionDialog } from './ui/ConfirmActionDialog';

<ConfirmActionDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleConfirm}
  title="Excluir item?"
  description="Esta ação não pode ser desfeita."
  infoItems={[
    { label: 'Nome', value: item.name },
    { label: 'Criado em', value: item.createdAt },
  ]}
  cancelLabel="Cancelar"
  confirmLabel="Excluir"
  loading={isDeleting}
/>
```

**Padrão visual interno do ConfirmActionDialog** (definido em `src/components/ui/ConfirmActionDialog.tsx`):
- Container: `max-w-4xl`, `Inter Tight` font family
- Title: 16px font-medium, color #0f172a
- Description: 14px font-normal, color #64748b
- Info card: `#f8fafc` bg, `#e2e8f0` border, rounded-lg p-3
- Botão Cancelar: `bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 h-9 flex-1`
- Botão Confirmar: `bg-slate-800 text-white hover:bg-slate-900 border-0 h-9 flex-1` (NUNCA vermelho)

### Z-index hierarchy

```
Dialog overlay/content:        z-[2000]
AlertDialog overlay/content:   z-[10000]
HeaderDropdown:                Z_INDEX.headerDropdown (lib/z-index.ts)
```

**CRÍTICO:** abrir Dialog DENTRO de AlertDialog faz o Dialog ficar invisível atrás. Use AlertDialog
dentro de AlertDialog (mesmo z-index, render order resolve).

---

## Banners informativos

### Banner discreto (sem card — preferido pra info contextual)

```tsx
<div className="flex items-start gap-1.5 px-1 font-normal text-slate-400"
     style={{ fontSize: '13px', lineHeight: '1.5' }}>
  <Info className="size-3.5 mt-0.5 shrink-0" />
  <span>
    Texto explicativo discreto. <strong>Negritos</strong> em slate-400 bold.
  </span>
</div>
```

### Banner destacado (com card colorido — pra avisos importantes)

**Sucesso/Info:**
```tsx
<div className="flex items-start gap-2 px-3 py-2 rounded-md"
     style={{ fontSize: '13px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
  <Info className="size-3.5 mt-0.5 shrink-0" />
  <span>Mensagem importante</span>
</div>
```

**Warning:** trocar pra amber-50/amber-700/amber-200
**Erro:** trocar pra red-50/red-700/red-200
**Info azul:** trocar pra blue-50/blue-700/blue-200

### Map drawing tip banner

```tsx
<div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[13px] text-blue-900">
  <p className="font-medium">Avisos importantes:</p>
  <p>- Item 1</p>
  <p>- Item 2</p>
</div>
```

---

## Feedback (toast, loading, empty state)

### Toast (sonner)

```tsx
import { toast } from 'sonner';

toast.success('Salvo com sucesso');
toast.error('Erro ao salvar');
toast.warning('Atenção');
toast.info('Info');
```

Override de font (já em app.css):
```css
[data-sonner-toast] {
  font-family: var(--font-ui) !important;
  font-weight: 400 !important;
}
```

### Loading bar (splash + transições)

```tsx
<div style={{
  width: '100px',
  height: '2px',
  backgroundColor: '#f1f5f9',
  borderRadius: '2px',
  overflow: 'hidden',
}}>
  <div style={{
    width: '40%',
    height: '100%',
    borderRadius: '2px',
    background: 'linear-gradient(90deg, #48b583, #3b9f73)',  /* brand gradient */
    animation: 'progress-slide 1.4s ease-in-out infinite',
  }} />
</div>
```

Keyframe em app.css:
```css
@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
```

### Spinner inline (botões/cards)

```tsx
<Loader2 className="size-4 animate-spin" />
```

### Empty state padrão

```tsx
<div className="text-center py-12 border border-zinc-200 rounded" style={{ backgroundColor: '#ffffff' }}>
  <p style={{ fontFamily: "'Inter Tight', sans-serif", color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
    Título do empty
  </p>
  <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '2px 0 0 0' }}>
    Mensagem/CTA
  </p>
</div>
```

### LoadingDialog

Componente próprio em `src/components/LoadingDialog.tsx` + hook `useLoadingDialog`. Usar pra operações
longas com feedback (importar backup, sync grande, etc).

---

## Splash screen e logo

### Splash inicial (App.tsx)

```tsx
<div className="fixed inset-0 flex items-center justify-center bg-white" style={{ zIndex: 9999 }}>
  <div className="flex flex-col items-center gap-6">
    {/* Logo via mask (preserva forma SVG mas pinta brand) */}
    <div style={{
      width: '180px',
      height: '60px',
      backgroundColor: '#3b9f73',
      WebkitMaskImage: 'url(/logo-e-name-cropware.svg)',
      maskImage: 'url(/logo-e-name-cropware.svg)',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      animation: 'splash-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
    }} />
    {/* Loading bar (ver acima) */}
  </div>
</div>
```

### Componente Logo (`src/components/Logo.tsx`)

3 layouts:
- `vertical`: SVG + texto centrado (usado em login)
- `horizontal`: SVG horizontal + divisor + tagline "Farm Data. Smart Decisions." (usado no header)
- `auth`: SVG + subtítulo opcional (usado em telas de auth)

Sobre fundo colorido, aplicar `filter: brightness(0) invert(1)` pra forçar branco:
```tsx
<img src="/logo-e-name-cropware.svg"
     style={{ filter: "brightness(0) invert(1)" }} />
```

### Assets em public/

```
public/logo-e-name-cropware.svg          // versão "máscara" (preto puro, pra filter invert)
public/logo-e-name-cropware-green.svg    // versão colorida (verde Cropware)
```

### Tagline (Alumni Sans)

```tsx
<p style={{
  fontFamily: "'Alumni Sans', sans-serif",
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.9)',
  lineHeight: 1.1,
}}>
  Farm Data<span style={{ color: '#4ade80' }}>.</span>
  <br />
  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Smart Decisions.</span>
</p>
```

**Atenção:** o ponto final colorido (`#4ade80`) usa a paleta brand. **No Farm vira slate-equivalente.**

---

## Mobile patterns

### Drawer (menu lateral mobile)

Aberto via event customizado (`open-mobile-drawer`), com header gradient brand:
```tsx
<div
  className="sticky top-0 z-10 flex items-center justify-between px-4 pt-3 pb-2 shrink-0 rounded-t-lg"
  style={{ background: 'linear-gradient(135deg, #48b583 0%, #3b9f73 100%)' }}
>
  {/* Título "Menu" + botão fechar */}
</div>
```

NavItem ativo no drawer:
```tsx
style={{ borderLeft: isActive ? '2.5px solid #3b9f73' : '2.5px solid transparent' }}
```

### Floating menu button (mobile)

```tsx
<button
  className="md:hidden flex items-center justify-between active:scale-[0.98] transition-transform"
  style={{
    position: 'fixed',
    left: 12, right: 12,
    bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    height: 48,
    zIndex: 50,
    background: 'linear-gradient(135deg, #48b583 0%, #3b9f73 100%)',  /* brand */
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    boxShadow: '0 6px 20px rgba(59, 159, 115, 0.35)',                  /* brand shadow */
  }}
>
  <span className="text-white font-medium" style={{ fontSize: 16 }}>Menu</span>
  <span className="flex items-center justify-center w-9 h-9 rounded-full text-white/90">
    <ChevronUp className="size-5" />
  </span>
</button>
```

### Safe area

Sempre usar `env(safe-area-inset-bottom, 0px)` em elementos fixed bottom (iOS notch/home indicator).

### Tap highlight

Globalmente removido:
```css
button, a, input, textarea, select, [role="button"] {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

---

## Regras críticas (NUNCA fazer)

### 1. NUNCA usar middle dot (·) ou bullet (•) em UI

Substitua sempre por `-` (hífen ASCII).

Exceção: **password masking** (`PasswordInput.tsx` usa `••••••••` como placeholder — convenção
universal). Mantém.

Variações também banidas:
- `·` U+00B7 (middle dot)
- `•` U+2022 (bullet)
- `‧` U+2027 (hyphenation point)
- `⋅` U+22C5 (dot operator)

Use `-`, `,`, `|` ou `/` pra separar.

### 2. Dialog dentro de AlertDialog precisa ser AlertDialog

Dialog comum (z-[2000]) abre atrás do AlertDialog (z-[10000]). Sempre usar AlertDialog quando
estiver renderizando modal dentro de outro modal.

### 3. Confirmação destrutiva = botão SLATE escuro, NUNCA vermelho

```tsx
<AlertDialogAction className="bg-slate-800 text-white hover:bg-slate-900 ...">
  Excluir
</AlertDialogAction>
```

### 4. Scroll stability (anti layout-shift do Radix Dialog)

Já configurado em app.css:
```css
html:root:root {
  scrollbar-gutter: stable;
  overflow-y: scroll !important;
  padding-right: 0 !important;
}
body, body[style] { padding-right: 0 !important; }
html[data-scroll-locked] { overflow-y: scroll !important; padding-right: 0 !important; }
body[data-scroll-locked] { padding-right: 0 !important; }
```

Sem isso, abrir Dialog desloca todo o conteúdo (Radix tenta compensar a scrollbar com padding-right).

### 5. Dropdowns/popovers com modal={false}

Pra não locker scroll do body:
```tsx
<DropdownMenu modal={false}>
```

### 6. Filtros: ordem alfabética obrigatória

### 7. Logos: sempre via `<Logo />` ou `<LogoSVG />`, nunca inline `<img>`

### 8. Map pin: quadrado rotacionado, verde `#16a34a`, centro branco

Padrão visual único pra map pins em todo o app.

---

## Tema Farm — o que muda

### O que MUDA (paleta brand → slate)

| Elemento | Field (atual) | Farm (proposto) |
|---|---|---|
| Header background | `#3b9f73` (cropware-green) | `#475569` (slate-600) **ou** `#1e293b` (slate-800) |
| Sub-header background | `#44b584` (light) | `#64748b` (slate-500) **ou** `#334155` (slate-700) |
| `--primary` token (HSL) | `158 47% 43%` | `215 19% 35%` (slate-600) |
| Tab principal ativa | `bg-[#3b9f73] text-white` | `bg-[#475569] text-white` (slate-600) |
| Tab secundária ativa | `bg-[#44b584] text-white` | `bg-[#64748b] text-white` (slate-500) |
| NavItem drawer border | `border-l-[#3b9f73]` | `border-l-[#475569]` |
| Drawer header gradient | `linear-gradient(135deg, #48b583, #3b9f73)` | `linear-gradient(135deg, #64748b, #475569)` |
| Floating menu button | gradient verde + shadow verde | gradient slate + shadow slate |
| Splash logo mask | `bg-[#3b9f73]` | `bg-[#475569]` |
| Loading bar gradient | `linear-gradient(90deg, #48b583, #3b9f73)` | `linear-gradient(90deg, #64748b, #475569)` |
| Tagline "." colorido | `#4ade80` (green-400) | `#94a3b8` (slate-400) **ou** manter um accent color do Farm |
| Logo SVG `--color-cropware-green` | `#3b9f73` | renomear pra `--color-cropware-slate` = `#475569` |
| `--cropware-green-light/dark` | usados em gradients | renomear pra slate equivalents |
| `viewingAsLabel` cor | `#6ee7a8` (emerald-300) | `#cbd5e1` (slate-300) |

**Recomendação de paleta slate brand pro Farm:**
- `--color-cropware-slate: #475569` (slate-600) — equivalente do "green"
- `--color-cropware-slate-light: #64748b` (slate-500) — equivalente do "green-light"
- `--color-cropware-slate-dark: #334155` (slate-700) — equivalente do "green-dark"

### O que NÃO MUDA (cores semânticas continuam universais)

- Toda a paleta semântica de badges/banners (emerald, amber, red, blue) — são **status**, não brand
- `--destructive` (red-500) — erro é erro
- Glass buttons no header — `rgba(255,255,255,0.12)` funciona em qualquer fundo escuro
- Cards: `border-slate-200`, `shadow-none`, `rounded-lg`
- Inputs: `h-9 border-slate-200 bg-white`
- Toolbar hierarchy: `bg-slate-700` (primária) > `bg-slate-100` (utility) > ghost (view)
- Fontes (Geist, Alumni Sans, JetBrains Mono pra badges)
- Z-index hierarchy (Dialog 2000, AlertDialog 10000)
- Sweep do `·`/`•`
- Botão confirmação destrutiva slate (já é slate, não muda)
- Empty state border-zinc-200
- Map pin verde `#16a34a` (cor de "campo / agro" — manter)

### Trabalho técnico estimado pra portar pro Farm

1. **Tokens** (`app.css`): renomear `--color-cropware-green*` pra `--color-cropware-slate*`, ajustar `--primary` HSL. Search-replace `#3b9f73` → `#475569`, `#48b583` → `#64748b`, `#2d8060` → `#334155`. ~1h
2. **Logo**: gerar novo `logo-e-name-cropware-slate.svg` (pode ser via mask + cor, ou export do Figma). ~30min
3. **Tagline**: trocar `#4ade80` (ponto colorido) por accent escolhido do Farm. ~5min
4. **CSS classes**: revisar `.tab-active-main`, `.tab-active-secondary`, `.cropware-active-secondary` (substituir hex inline). ~30min
5. **Hardcoded hex sweep**: grep `#3b9f73|#48b583|#2d8060|#44b584` no codebase, trocar tudo. ~1-2h dependendo de quantidade
6. **Visual QA**: rodar build, testar todas as telas, ajustar contraste. ~2-3h

**Total estimado: 5-7h pra portar a paleta sem regressão.**

---

## Referências dentro do código

- `src/app.css` — todos os tokens, overrides globais, animações, scroll stability
- `src/components/ui/*` — componentes shadcn base (button, badge, card, input, dialog, alert-dialog, etc)
- `src/components/Logo.tsx` — componente Logo + LogoSVG
- `src/components/MainAppHorizontalLayout.tsx` — barra de tabs principal + drawer mobile
- `src/App.tsx` (lines ~2240-2470) — header desktop + mobile + sub-header status bar + splash
- `src/components/ui/ConfirmActionDialog.tsx` — padrão de dialog de confirmação
- `src/lib/z-index.ts` — hierarquia oficial de z-index

## Documentos relacionados

- `.agent/DESIGN_SYSTEM.md` (1211 linhas) — documentação original mais profunda
- `docs/ui-polish-patterns.md` — padrões de polimento

## Memórias relevantes (já internalizadas)

- Badge typography (JetBrains Mono 12px UPPERCASE)
- NUNCA usar `·` ou `•` (exceto password masking)
- Dialog vs AlertDialog z-index
- Padrão de toolbar (flat slate hierarchy)
- Filter bar + ordenação alfabética
