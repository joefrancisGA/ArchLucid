> **Scope:** ArchLucid brand system — colors, typography, layout, components, content language, and logo direction. Derived from the shipped V1 operator shell and marketing surfaces (April 2026).

# ArchLucid brand system

**Audience:** Designers, front-end engineers, and marketing contributors who need to create or extend ArchLucid surfaces with visual consistency.

**Grounding rule:** Every token, pattern, and guideline in this document describes what is **already shipped** in the `archlucid-ui` codebase. Aspirational changes are marked explicitly in "Next" callouts. If the UI diverges from this document, update the document — not the other way around — unless a deliberate brand evolution has been approved.

**Tech stack:** Next.js App Router, Tailwind CSS (class strategy, no CSS variables), shadcn/ui (new-york style, `neutral` base color), `lucide-react` icons. Dark mode via `class="dark"` on `<html>`, persisted in `localStorage` key `archlucid_color_mode`.

---

## 1. Brand core

### Positioning

ArchLucid is an **AI Architecture Review Board** platform. It orchestrates specialized AI agents to analyze system designs, produce explainable findings, and enforce governance workflows — all with a durable audit trail.

Category label (UI constant): `BRAND_CATEGORY = "AI Architecture Review Board"` (`archlucid-ui/src/lib/brand-category.ts`).

### Tagline

> Ship governed architecture decisions faster

This is the `<h1>` on the marketing landing page (`WelcomeMarketingPage`).

### Brand personality

- **Authoritative, not flashy.** The product proves claims with evidence, not adjectives.
- **Precise, not verbose.** Short sentences. No filler.
- **Structured, not creative-chaotic.** Every output is a structured block (finding, recommendation, evidence), never raw prose.
- **Confident, not hype-driven.** "Detected 3 policy violations" over "AI suggests you might want to consider..."

---

## 2. Color system

All colors are Tailwind palette classes. The `tailwind.config.ts` `theme.extend` is deliberately empty — brand colors are expressed as Tailwind utilities (`teal-700`, `neutral-200`, etc.), not custom tokens. This keeps the design system lightweight and avoids shadcn/CSS-variable coupling.

### Primary brand color

| Role | Light | Dark | Tailwind | Hex |
|------|-------|------|----------|-----|
| Primary CTA / buttons | `bg-teal-700` | `bg-teal-800` | teal-700 | `#0f766e` |
| Primary CTA hover | `hover:bg-teal-800` | `dark:hover:bg-teal-700` | teal-800 | `#115e59` |
| Inline links | `text-teal-800` | `dark:text-teal-300` | teal-800 / teal-300 | `#115e59` / `#5eead4` |
| Active sidebar item | `bg-teal-50 text-teal-900` | `dark:bg-teal-900/30 dark:text-teal-200` | — | — |
| Active wizard step | `border-teal-700 bg-teal-700 text-white` | same | teal-700 | `#0f766e` |

**Why teal?** Enterprise-serious without the generic quality of pure blue. Distinct enough to stand out against the neutral shell, muted enough to not feel consumer-playful.

### Shell / chrome (neutral palette)

| Role | Light | Dark |
|------|-------|------|
| Page background | `bg-neutral-50` | `bg-neutral-950` |
| Body text | `text-neutral-900` | `text-neutral-100` |
| Header background | `bg-neutral-50/95 backdrop-blur` | `bg-neutral-950/95` |
| Borders | `border-neutral-200` | `dark:border-neutral-700` or `dark:border-neutral-800` |
| Secondary text | `text-neutral-600` | `dark:text-neutral-400` |
| Muted / meta text | `text-neutral-500` | `dark:text-neutral-400` |

### Layer orientation colors

The product has three conceptual layers. Each renders a subtle full-width strip under the header (`LayerContextStrip`). These colors are **orientation cues**, not brand primaries — they stay desaturated so the strip never competes with page content.

| Layer | Strip | Label | Meaning |
|-------|-------|-------|---------|
| **Pilot** | `bg-blue-50/90` | `text-blue-900` / `dark:text-blue-200` | Pre-commit analysis path |
| **Operate · analysis** | `bg-teal-50/80` | `text-teal-900` / `dark:text-teal-200` | Post-commit review, graph, compare, replay |
| **Operate · governance** | `bg-amber-50/80` | `text-amber-900` / `dark:text-amber-200` | Policy packs, audit, alerts, approvals |

### Semantic / feedback colors

| Semantic | Light border + background | Dark | Use case |
|----------|--------------------------|------|----------|
| Error | `border-red-800 bg-red-50 text-red-900` | `dark:border-red-900 dark:bg-red-950/80 dark:text-red-100` | API failures, violations |
| Warning | `border-amber-500 bg-amber-50 text-amber-950` | `dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50` | Non-fatal issues, trial banners |
| Success | emerald palette (badges, diff "added") | emerald dark variants | Valid architecture, passing checks |
| Info / malformed | `border-violet-600 bg-violet-50 text-violet-950` | `dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100` | Contract drift, unexpected shapes |
| Empty state | `border-neutral-300 bg-neutral-50 text-neutral-800` | `dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-200` | No data yet |

### Accent (use sparingly)

Focus rings on teal CTA links use `#0f766e`. Shell nav focus rings use `#2563eb` (blue-600). The skip-link background is `#0f172a` (slate-900). These are accessibility affordances, not decorative accents.

---

## 3. Typography

### Font stack

The product ships **system `font-sans`** — the Tailwind default system-UI stack (`ui-sans-serif, system-ui, -apple-system, ...`). No custom web font is loaded via `next/font` or CDN.

**Why system fonts?** Zero FOIT/FOUT, zero layout shift, zero external dependency. Appropriate for an enterprise tool where content density matters more than typographic branding.

> **Next:** If a custom font is adopted, **Inter** is the recommendation — it is variable-weight, optimized for UI density, and enterprise-safe. Wire it via `next/font/google` in `layout.tsx` with `display: "swap"` and add it to `tailwind.config.ts` `fontFamily.sans`.

### Monospace

`kbd` elements and inline `<code>` use `ui-monospace, monospace` (set in `globals.css`).

### Type scale (Tailwind utilities)

| Level | Tailwind class | Approx. size | Weight | Use |
|-------|---------------|-------------|--------|-----|
| Page title (H1) | `text-2xl` – `text-3xl` | 24–30px | `font-semibold` or `font-bold` | Shell header, marketing hero |
| Section header (H2) | `text-xl` – `text-2xl` | 20–24px | `font-bold` or `font-semibold` | Document sections |
| Subsection (H3) | `text-lg` | 18px | `font-semibold` | Card titles, subsections |
| Body | `text-base` | 16px | `font-normal` | Paragraphs, descriptions |
| Small / meta | `text-sm` | 14px | varies | Labels, secondary info |
| Tiny / captions | `text-xs` | 12px | `font-semibold` for labels | Sidebar groups, badges, kbd hints |

### Tone rules

- Short sentences.
- No marketing adjectives ("revolutionary", "cutting-edge", "best-in-class").
- Prefer: **"Detected"**, **"Validated"**, **"Recommended"**, **"Finalized"**, **"Governed"**.
- Avoid: "Let's explore...", "Here's what you might consider...", "AI suggests..."
- Error messages state what happened, what the user can try next, and stop.

---

## 4. Dark mode

Dark mode is a **first-class citizen**, not an afterthought. Every component ships with `dark:` variants.

### Mechanism

1. Inline `<script>` in `layout.tsx` reads `localStorage` key `archlucid_color_mode` before first paint (no flash).
2. Toggles `class="dark"` on `<html>`.
3. `ColorModeToggle` component renders a **three-segment control** (Light / Dark / System) in the header. Active segment uses `bg-teal-700` (light) or `bg-teal-800` (dark).
4. `tailwind.config.ts` sets `darkMode: "class"`.

### Dark mode palette summary

| Surface | Light | Dark |
|---------|-------|------|
| Page | `neutral-50` | `neutral-950` |
| Cards | `white` / `bg-white` | `neutral-900` |
| Borders | `neutral-200` | `neutral-700` or `neutral-800` |
| Body text | `neutral-900` | `neutral-100` or `neutral-200` |
| Teal links | `teal-800` | `teal-300` |
| Teal buttons | `teal-700` | `teal-800` (dark hover reverses to `teal-700`) |
| `kbd` | `bg-neutral-50 border-neutral-300` | `bg-neutral-800 border-neutral-600` |

---

## 5. Layout

### App shell (operator)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: [Logo]  [Command Palette] [Ctrl+K]  [Theme]       │
│  Breadcrumbs:  Home > Runs > Run-42     [Scope] [Help]     │
├─────────────────────────────────────────────────────────────┤
│  Layer context strip (full width, subtle color)             │
├───────────┬─────────────────────────────────────────────────┤
│  Sidebar  │  Main content area                              │
│  15.5rem  │  max-width: 1600px                              │
│  (lg+)    │  px-4 py-4 (lg: px-6 py-6)                     │
│           │                                                 │
│  Nav      │  [Auth Panel]                                   │
│  groups   │  [Trial Banner]                                 │
│  with     │  [Page content]                                 │
│  collapse │                                                 │
├───────────┴─────────────────────────────────────────────────┤
│  (Footer: none — operator shell has no footer)              │
└─────────────────────────────────────────────────────────────┘
```

- **2-panel layout:** collapsible sidebar (hidden below `lg`) + main content.
- **Max width:** `1600px` on header and content container.
- **Header:** sticky, `backdrop-blur`, `z-30`, border-bottom.
- **Sidebar:** `w-[15.5rem]`, border-right, collapsible nav groups with localStorage persistence, progressive disclosure toggles (Essential → Extended → Advanced).
- **Mobile:** sidebar replaced by `MobileNavDrawer`.

### Document layout

Long-form reading pages (`DocumentLayout`) use `max-w-3xl` article width with optional sticky TOC at `xl` breakpoint (shown when 3+ headings). Print-friendly: `print:max-w-none`, hidden shell chrome.

### Marketing pages

Marketing route group `(marketing)` has its own layout chrome. Pages use `max-w-5xl` centered content with hero, pillar cards, and pricing sections.

---

## 6. Component system

### Buttons (`button.tsx`, CVA)

| Variant | Light | Dark |
|---------|-------|------|
| `default` (neutral) | `bg-neutral-900 text-neutral-50` | — |
| `secondary` | `bg-neutral-200 text-neutral-900` | `dark:bg-neutral-700 dark:text-neutral-50` |
| `destructive` | `bg-red-600 text-white` | `dark:bg-red-600` |
| `outline` | `border-neutral-300 bg-white` | `dark:border-neutral-600 dark:bg-neutral-900` |
| `ghost` | transparent, `hover:bg-neutral-100` | `dark:hover:bg-neutral-800` |
| `link` | underline on hover | — |

**Teal CTA override:** Primary call-to-action buttons override with `className="bg-teal-700 text-white hover:bg-teal-800"`. This is not a CVA variant — it is an intentional per-instance override applied on CTAs like "See it in 30 seconds", "Start new run", "Commit manifest".

### Cards

Two card patterns coexist:

1. **shadcn `Card`** — `rounded-xl`, oklch border/background, shadow. Used for structured UI panels.
2. **`SectionCard`** — `rounded-lg border border-neutral-200 p-4`. Simpler, used for grouped page sections.
3. **Marketing pillar cards** — `rounded-lg border border-neutral-200 bg-white p-5 shadow-sm`. White background, subtle shadow.

### Callout messages (`OperatorShellMessage.tsx`)

Shared base: `max-w-3xl rounded-lg px-4 py-3 text-[15px] leading-snug`.

| Variant | Border | Background | Text |
|---------|--------|------------|------|
| Error | `red-800` | `red-50` | `red-900` |
| Warning | `amber-500` | `amber-50` | `amber-950` |
| Empty | `neutral-300` | `neutral-50` | `neutral-800` |
| Loading | `neutral-300` | `slate-50` | `slate-800` |
| Malformed | `violet-600` | `violet-50` | `violet-950` |

### Badges (`badge.tsx`)

shadcn badge with oklch colors: `default`, `secondary`, `destructive`, `outline`. Semantic badges in product code use Tailwind overrides (emerald for low risk, amber for medium, rose for high).

### Status indicators

Use Tailwind color + text (not icons as primary signal — icons supplement for scannability):

| Status | Color family | Example |
|--------|-------------|---------|
| Valid / passing | emerald | `bg-emerald-50 text-emerald-800` |
| Warning / partial | amber | `bg-amber-50 text-amber-900` |
| Violation / failing | red | `bg-red-50 text-red-900` |
| Informational | blue or neutral | contextual |

### Data blocks

Findings, recommendations, and evidence are always **structured blocks** (cards or callout regions with clear borders), never raw paragraphs. This is a product-level UX rule, not just a styling preference.

---

## 7. Iconography

**Library:** `lucide-react` (thin-line, geometric, consistent 24px viewbox / 2px stroke).

**Usage rules:**
- Icons supplement text labels; they do not replace them.
- Sidebar nav icons: `h-4 w-4 shrink-0 opacity-90`.
- Empty state hero icons: `h-12 w-12 text-teal-700 dark:text-teal-400`.
- Icon-only buttons require `aria-label`.

**Avoid:**
- Emoji in operator UI (marketing pages may use sparingly in headings).
- Filled/solid icon styles — keep to outlined/line weight.
- Mixing icon libraries.

---

## 8. Content language

### Preferred terms

| Weak / generic | Strong / ArchLucid |
|-----------------|---------------------|
| Run | Analysis run |
| Commit (generic) | Finalize decision |
| Artifacts | Evidence |
| Results | Findings |
| Dashboard home | Operator workspace |
| Check | Policy evaluation |

### Preferred phrasing patterns

- "Detected 3 policy violations in the networking topology."
- "Recommendation: Introduce an API gateway layer (confidence: 84%)."
- "Manifest finalized — 12 findings, 0 critical violations."
- "Evidence: ExplainabilityTrace links 4 source nodes to this finding."

### Avoid

- "Let's explore your architecture..."
- "Here's what you might consider..."
- "AI suggests..."
- "Best practice" without citing the specific rule or policy.

---

## 9. Logo system

### Current state

The product renders the word **"ArchLucid"** as `text-2xl font-semibold tracking-tight` in the header — plain text, no icon or logomark. This is intentional for V1.

### Recommended direction (when a logomark is commissioned)

**Concept:** Structured geometry with an illuminated core.

- **Structure** → architecture (angular shapes, subtle grid lines).
- **Light** → lucidity / clarity (one highlighted element — a node, a facet, a line — in teal-700).

**Variants to produce:**

1. Full logo (icon + "ArchLucid" wordmark)
2. Icon only (favicon, app icon, avatar)
3. Monochrome (single neutral — for print, watermarks)
4. Dark mode (white wordmark + teal icon on dark background)

**Constraints:**

- Must be legible at 16x16 (favicon) and 256x256 (app icon).
- No gradients — flat fills only.
- Icon should work inside a circle (social avatars) and a square (favicon).
- Teal-700 (`#0f766e`) is the accent color in the icon.

---

## 10. Print

The operator shell supports `Ctrl+P` / browser print on document pages. Print styles live in `globals.css`:

- Header, sidebar, and skip-link are hidden.
- Main content resets to full width, zero padding.
- Body forced to `white` background, `black` text.
- Headings avoid page-break-after; tables/pre/figure avoid page-break-inside.
- `DocumentLayout` adds `print:max-w-none print:text-black`.

---

## 11. Accessibility baseline

These are brand-level accessibility commitments, not just engineering details:

- **WCAG 2.1 AA** target across all operator and marketing surfaces.
- Skip-to-main-content link (first focusable element).
- Visible focus rings on all interactive elements (teal on CTAs, blue on shell nav).
- Inline links underlined to meet 1.4.1 (link-in-text-block).
- `aria-current="page"` on active sidebar links; `aria-current="step"` on active wizard step.
- Route changes announce via `RouteAnnouncer` (live region).
- Color mode toggle is keyboard-operable with `role="group"`.
- axe-core component suite runs in CI (`npm run test:axe-components`).
- Playwright e2e covers keyboard navigation and live API flows.

---

## 12. Landing page structure (marketing)

### Above the fold

```
  [Eyebrow: AI Architecture Review Board]

  Ship governed architecture decisions faster

  [30-second pitch paragraph]

  [See it in 30 seconds]  [Start free trial]  [Sign in]
```

### Sections

1. **Three pillars** — AI-native analysis, auditable decision trail, enterprise governance. Card grid, `md:grid-cols-3`.
2. **Pricing overview** — Tier cards loaded from `/pricing.json` at build time, not hard-coded.
3. **Supporting links** — demo preview, worked example PDF.

### Marketing pages inventory

| Route | Purpose |
|-------|---------|
| `/welcome` | Landing / hero |
| `/see-it` | 30-second proof point |
| `/demo/preview` | Full committed demo (no signup) |
| `/pricing` | Tier detail |
| `/signup` | Registration form |
| `/why` | Competitive differentiation |
| `/trust` | Enterprise trust signals |
| `/security-trust` | Security posture |
| `/accessibility` | Accessibility statement |
| `/compliance-journey` | Compliance narrative |
| `/showcase/[runId]` | Public showcase of a specific run |
