> **Scope:** Contributor-reference — Owner-ratified UI aesthetic standard for ArchLucid V1 GA and beyond. Authoritative for all UI work.  
> **Decision date:** 2026-05-27. **Owner:** product owner.  
> **Audience:** engineers, AI coding agents, and designers working on `archlucid-ui/`.

# UI design system standard

ArchLucid is an enterprise governance product for regulated architecture review.  
Its UI must look and feel like a serious enterprise system — not a startup dashboard.

---

## Design system hierarchy

| Tier | System | Role |
|------|--------|------|
| **Primary** | [IBM Carbon Design System](https://carbondesignsystem.com/) | Core visual language, information architecture, components |
| **Secondary** | [Microsoft Fluent 2](https://fluent2.microsoft.design/) | Shell/navigation polish, Azure-adjacent familiarity |
| **Tertiary (reference only)** | [Atlassian Design System](https://atlassian.design/) | Workflow clarity, issue/finding states |
| **Discipline reference** | [GOV.UK Design System](https://design-system.service.gov.uk/) | Plain language, accessibility, regulated-surface seriousness |

### Why Carbon

Carbon is IBM's open-source enterprise design system, built for regulated workflows, data-heavy pages, governance surfaces, and professional users.  
It handles dense information, data tables, side panels, forms, status tags, notifications, accordions, tabs, progress indicators, and structured workflows — precisely the surfaces ArchLucid needs.

**The target is:** *Carbon-inspired enterprise product UI — not copied IBM branding.*

### Why Fluent 2 as secondary

ArchLucid is Azure-oriented and targets Microsoft-heavy enterprise buyers.  
Fluent 2 provides command bars, panels/drawers, form layout, and subtle elevation consistent with Microsoft 365-style tooling.  
ArchLucid should **not** look exactly like Azure Portal — Azure Portal is powerful but visually busy; ArchLucid should be calmer.

### Atlassian and GOV.UK

- Atlassian: use only for workflow clarity and task/finding state patterns. Not a visual reference.
- GOV.UK: use only for copy clarity and accessibility discipline. Not a visual style reference.

---

## Aesthetic rules (normative)

These rules apply to all operator-facing and marketing surfaces. Agents and engineers must follow them when writing or reviewing UI code.

### Color and surface

- Use **neutral grays** as the dominant surface palette.
- Use the **restrained teal accent** purposefully. Reduce teal border overuse — borders should communicate state, not decorate.
- Avoid **large pastel cards** unless they communicate actionable status (Ready / Warn / Blocked).
- No decorative gradients on enterprise surfaces.

### Spacing and density

- Use **compact, readable enterprise spacing** — avoid giant marketing-card layouts inside operator views.
- Information density should match the density of a serious governance or audit tool, not a consumer app.

### Typography

- **Accessible, disciplined typography.** Prefer size and weight to distinguish hierarchy over color alone.
- Body copy should be readable at a glance — no decorative font choices.
- Use `OPERATOR_TYPOGRAPHY` from `design-tokens.ts` (page title `text-xl`, section labels `text-xs` uppercase, body `text-sm`, badge `text-[11px]`). Do not add arbitrary `text-[10px]` on operator surfaces.

### Components

- Prefer **structured enterprise cards, data tables, tabs, accordions, command bars, and side panels**.
- Status tags must be consistent and semantic:
  - `Ready` · `Needs attention` · `Blocked` · `Approved` · `Approved with monitoring`
- Primary content must be **visibly dominant**; diagnostics and supporting content must be **quieter** (lower contrast, smaller, collapsed by default).

### Language

Use precise product language throughout the UI — labels, headings, empty states, tooltips, and error messages:

| Preferred | Avoid |
|-----------|-------|
| Architecture package / review | Run, job, task |
| Finding | Issue, alert (unless it is an alert) |
| Residual risk | Open issue |
| Evidence trail / Evidence graph (see split below) | Logs, output |
| Signed review record (package) | Signed decision record, golden manifest |
| Decision (disposition) | Calling the package a decision record |
| Governance approval | Sign-off, approval |
| Audit trail | History |

**Evidence trail vs Evidence graph (TB-2097 — decision B):**

| Term | Role | Use when |
|------|------|----------|
| **Evidence trail** | **Concept** — the diligence chain evidence → findings → decisions → signed review record | Glossary, Related-links, help topics, and copy that names the *idea* of governed linkage |
| **Evidence graph** | **Surface** — `/insights/evidence-graph` and journey destinations that open that route | Page titles, nav, golden-journey step pills, surface CTAs that name the graph UI |

Do **not** use “Evidence trail” as the title, tab, or destination pill for `/insights/evidence-graph`. Keep glossary and Related-links “Evidence trail” labels unless an explicit rename of the concept is approved.

### Technical details

- **Hide CLI/script/API/model/runtime details from normal product surfaces.**
- Keep technical details behind a "Diagnostics", "Technical appendix", or chevron-expandable disclosure.
- Developer-facing identifiers (run IDs, UUIDs, correlation IDs) are fine in copy mode or support contexts, not in primary architect workspace.

### Form validation affordances (**TB-2005** — done 2026-07-29)

Operator and buyer forms must make hard validation visible on the form and honest in the primary affordance. Owner expectation (create-architecture draft workspace, 2026-07-29): do not enable a primary CTA that cannot succeed, and do not put “fill required fields” feedback only in a toast.

| Rule | Required behavior |
|------|-------------------|
| Primary CTA | **Disable** submit / continue / start until hard minimum client-side validation passes (required presence, min length, client-known numeric ranges). Soft/advisory warnings may leave the CTA enabled. |
| Validation placement | Show errors **on the form** — field-level under the control and/or a form-level readiness line near the CTA. Prefer `aria-invalid` when the control is invalid after the user has started editing. |
| Toasts (`showError`) | **Only** for system/async failures: network, server 4xx/5xx, save conflicts, clipboard failures, unexpected API payloads. Never the sole feedback for empty/required/format errors the client already knows. |
| Dual feedback | Do not toast the same client-known validation message that is already shown inline. |

**Good exemplars:** Guided intake / create-architecture continue (`SocraticIntakeWizard` `canAdvanceIntent` + advance hint); Quick Scan (`canSubmit` + readiness); Alert rules / Digest create / SSO wizard footers (`formValid` / `canContinue`).

**Open apply / cleanup:** **TB-2006**–**TB-2011** in `TECH_BACKLOG.md`. Cursor enforcement: `.cursor/rules/UI-Form-Validation-Affordances.mdc`.

### Operator page contextual help — Learn more job match (**TB-2048** — done 2026-08-05)

`PageContextualHelpButton` / Category-1 popovers teach the **current page job**. The **Learn more** escape hatch must not send the operator to a generic Getting started / How it works guide when the page is a secondary hub.

| Rule | Required behavior |
|------|-------------------|
| Job match | Learn more targets `/help/{slug}` whose **primary job** matches the route (same job as the Category-1 answers), **or** Learn more is **omitted** when no honest job-matched guide exists. |
| Ban (secondary hubs) | Do **not** map Learn more to `getting-started` or `how-it-works` solely because a `page-help-topic-map` row exists. Secondary hubs include Digests, Planning, Decision register, Advisory scans, Impact preview, and other non-first-run operator destinations. |
| First-run allowlist | `getting-started` / `how-it-works` **are** allowed when the page’s primary job *is* first-run / onboarding / draft bootstrap — e.g. Overview empty/home onboarding, `/onboarding*`, `/architecture/reviews/new*`, Architectures list/create/draft workspace, Quick start / get-started marketing. Document the allowlist when adding map rows. |
| Prefer existing specialty | Prefer an existing specialty or curated product-help slug over inventing an orphan `/help` page. New specialty bodies coordinate **TB-1414** (do not invent bare markdown dumps). |
| Mount vs target | *When* to mount `PageContextualHelpButton` remains **TB-1666**–**TB-1670**. This rule owns Learn more **targets** only. |

**Code touchpoints (apply in follow-on rows):** `page-help-topic-map.ts` (`pageHelpTopicForPathname`), `PageContextualHelpButton` / `PageScopedContextualHelpPanel` Learn more href. Remaps: Digests golden **TB-2049** Done; secondary-hub sweep **TB-2050** Done (2026-08-05); popover deep-link CTAs **TB-2051** Done (2026-08-05); Vitest suite **TB-2052** Done (2026-08-06) — `learn-more-job-match.test.ts` + `learn-more-job-match-inventory.ts`.

**Good exemplar (target state):** Digests Category-1 answers discuss Schedule/recipients; Learn more must open digests-relevant help (or omit) — not `/help/getting-started`. Category-1 what-to-do-next / where-to-configure fields that name a tab or operator route should expose optional `{ label, href }` actions (`PageContextualHelpAction`) rendered in `PageScopedContextualHelpPanel`.

---

## What this standard forbids

- Using Tailwind/shadcn defaults as the visual north star. They are fine primitives; they are **not** the aesthetic target.
- "Make it pretty" decoration — gradients, glow effects, heavy shadows, oversized icons.
- Consumer SaaS aesthetics: rounded hero cards, marketing-style CTAs in operator views, playful empty states.
- Internal-test-harness aesthetics: raw JSON dumps, unstyled lists, visible implementation artifacts.

---

## Ratified instruction for AI coding agents

> Use IBM Carbon Design System as the primary visual and interaction reference for ArchLucid, with selective Microsoft Fluent 2 influence for shell/navigation polish. Do not copy IBM or Microsoft branding. Apply the design principles: restrained enterprise UI, strong information hierarchy, neutral surfaces, disciplined spacing, accessible typography, mature status tags, clear tables, clean side panels, and minimal decorative styling.
>
> ArchLucid must look like a serious enterprise governance product for regulated healthcare/financial architecture review — not a startup dashboard, game UI, consumer SaaS page, or internal test harness.
>
> Specific rules:
> - Neutral grays and restrained teal accent only.
> - Reduce teal border overuse.
> - Avoid large pastel cards unless they communicate actionable status.
> - Prefer structured enterprise cards, data tables, tabs, accordions, command bars, and side panels.
> - Use status tags consistently: Ready, Needs attention, Blocked, Approved, Approved with monitoring.
> - Make primary content visibly dominant; diagnostics/supporting content quieter.
> - Compact, readable enterprise spacing; no giant marketing cards in architect workspace views.
> - Hide CLI/script/API/model/runtime details from normal surfaces.
> - Keep technical details behind diagnostics or technical appendix disclosures.
> - Use precise product language: architecture package, finding, residual risk, evidence trail, signed review record, decision, governance approval, audit trail. Never call the package a signed decision record.
> - Design for CIO/procurement/compliance credibility.

---

## Design tokens (TB-114)

Authoritative implementation: `archlucid-ui/src/lib/design-tokens.ts` and CSS variables in `archlucid-ui/src/app/globals.css` (prefix `--al-*`). Tailwind utilities use the `al-*` namespace (for example `bg-al-surface-raised`, `text-al-text-secondary`).

| Token | Light-mode role |
|-------|-----------------|
| `--al-surface-base` | Page background (`$layer-00`) |
| `--al-surface-raised` | Cards, tables, callouts (`$layer-01`) |
| `--al-accent-interactive` | Links, selected row left border |
| `--al-accent-border-focus` | Focus rings (interactive only) |
| `--al-status-*` | Semantic fills for `StatusTag` / `SeverityTag` |
| `--al-layer-hover` | Table row hover |

Use `DESIGN_TOKENS.callout.*` for warn/blocked/info banners — not decorative `bg-*-50` pastels on neutral cards.

For checklist rows, proof disposition strips, and step rails, use `operatorSemanticSurface`, `operatorSemanticBadge`, or `operatorConfidenceSurface` from `design-tokens.ts` (**TB-115**). Teal borders belong on focus rings, links, and the active nav accent — not full card fills.

---

## Spacing convention (TB-118) — done 2026-05-31

Operator views (not marketing):

| Use | Tailwind |
|-----|----------|
| Page section stack | `space-y-4` |
| Card padding | `p-4` |
| Inline controls | `gap-2` |
| Section heading → content | `mb-3` |

Avoid `space-y-8`, `py-8`, and marketing-scale hero cards inside `(operator)/` routes.

---

## Typography convention (TB-119) — done 2026-05-31

Canonical classes live in `archlucid-ui/src/lib/design-tokens.ts` as `OPERATOR_TYPOGRAPHY` (also `DESIGN_TOKENS.typography`). Bulk migration: `archlucid-ui/scripts/migrate-tb119-operator-typography.ps1`.

| Role | Token | Classes |
|------|-------|---------|
| Page heading | `pageTitle` | `text-xl font-semibold tracking-tight text-al-text-primary` |
| Section heading | `sectionTitle` | `text-xs font-semibold uppercase tracking-wide text-al-text-secondary` |
| Card / subsection title | `cardTitle` | `text-sm font-semibold text-al-text-primary` |
| Body | `body` | `text-sm leading-relaxed text-al-text-primary` |
| Meta / caption | `meta` | `text-sm text-al-text-secondary` |
| Label | `label` | `text-xs text-al-text-secondary` |
| Inline data value | `dataValue` | `text-sm font-medium tabular-nums text-al-text-primary` |
| KPI numeric (exception) | `kpiValue` | `font-mono text-4xl font-semibold tabular-nums text-al-text-primary` — dashboard/metric tiles only |

Do not use `text-2xl` / `text-3xl` on operator page titles. Hierarchy must use **size + weight** (and case for section labels), not color alone.

### Typography normalization progress (token sweep)

**Last rescored:** 2026-06-26 (EST, after wave 91 — bulk components sweep).

| Layer | Status | Files with ad-hoc sizes | Ad-hoc matches |
|-------|--------|-------------------------|----------------|
| `(operator)/` routes | **Complete** | **0** | **0** |
| `src/components/` | **Complete** | **0** | **0** |
| **Headline score** | | **100%** | |

`(0.25 × 1.00) + (0.75 × (920 − 0) / 920) = 1.00` → **100%**

**Wave 91 (2026-06-26):** Bulk sweep via `archlucid-ui/scripts/migrate-typography-sweep-components.ps1` (regex `\b` fix for `text-[Npx]`, embedded class literals, import dedupe) + manual stragglers (`DocumentLayout` → `OPERATOR_DOCUMENT_ARTICLE_BODY`, callout ternaries, policy provenance compact branches). **181** files import-deduped after script passes.

**Completed buckets (components phase, do not regress):**

| Bucket | Status |
|--------|--------|
| `(operator)/` App Router pages | Complete |
| **`src/components/` (all buckets)** | **Complete** |
| Bulk migration script + import repair | Complete |

Regenerate metrics: `rg "text-(xs|sm|base|xl|\[1[0-9]px\])" archlucid-ui/src/components --glob '*.{tsx,ts}' --count` (exclude `__snapshots__`; Vitest snapshots may still echo expanded token class strings).

---

## Inline metadata `Label: value` emphasis (TB-1996) — done 2026-08-04

Buyer-facing proof and status metadata often appears as a single line: **key**, colon, then value (e.g. `Audit trail: Complete`). The **label** (text before the colon) must be visually stronger than the value so operators can scan keys quickly.

| Role | Token / component | Weight |
|------|-------------------|--------|
| Metadata key | `INLINE_METADATA_LABEL_CLASS` / `InlineMetadataLabel` / `InlineMetadataLine` | `font-medium` |
| Instructional prefix (`Next:`, `Use this when:`) | `INLINE_GUIDANCE_LABEL_CLASS` / `InlineGuidanceLabel` | `font-semibold` |
| Title-weight decision lines (`Decision: Package finalized`) | Section/title typography on the **whole** line | Do **not** split into medium label + value |

**Do use** medium labels on: showcase buyer-proof rows, inspector metadata rows, value-report counters, policy-pack meta, intake confirm summaries.

**Do not** bold every colon in prose, headings, code, legal copy, or guidance lines that already use `InlineGuidanceLabel`.

Product separator is a colon (`Label: value`), not a comma.

---

## Components (TB-116, TB-117) — done 2026-05-31

| Component | Path | Migrated surfaces |
|-----------|------|-------------------|
| `StatusTag` | `archlucid-ui/src/components/ui/status-tag.tsx` | Run/governance badges |
| `SeverityTag` | `archlucid-ui/src/components/ui/severity-tag.tsx` | Findings, governance queue |
| `EnterpriseTable` | `archlucid-ui/src/components/ui/enterprise-table.tsx` | Reviews list, governance findings, operator audit |
| `Tabs` / `EnterpriseTabs` | `archlucid-ui/src/components/ui/tabs.tsx` | Shared WAI-ARIA tabs (**TB-665**); default **`variant="pill"`** (Reviews hub exemplar); `variant="line"` for legacy underline only |

### Tabbed interfaces — Reviews hub exemplar (owner decision 2026-08-09)

**Visual reference:** `/architecture/reviews` (`ReviewsHubReviewInventory` + `ReviewsHubSummaryRow`).

| Pattern | Exemplar on Reviews hub | Component / API |
| --- | --- | --- |
| **Section tabs** (Browse / Overview / Findings — swap panels below) | Filter row silver pills (same visual as list filters) | `<Tabs variant="pill">` — default; styles in `tabs-pill-styles.ts` via `buyerFilterChipClass` |
| **List filters** (All / Needs attention — narrow one table) | Filter row silver pills | `FilterChip` + `buyerFilterChipClass` (`aria-pressed`) |
| **Read-only KPI strip** (Active / Finalized counts) | Summary row tiles | `rounded-md` metric cards — **not** tabs; do not use `Tabs` or `FilterChip` |

**Rules:**

- Operator section tabs use **`variant="pill"`** (default) — silver `rounded-full` chips with neutral border; selected state = light grey fill (`buyerFilterChipClass`).
- Do **not** add one-off `rounded-md` segmented containers, underline line tabs, or per-call-site pill `className` overrides on `TabsTrigger`.
- `variant="line"` (teal underline) is legacy-only; new surfaces must not introduce it.
- List filters that narrow a single dataset stay on **`FilterChip`** even when they look like tabs — semantics differ (`aria-pressed` vs `role="tablist"`).

### Tabs vs buttons vs filter chips vs segmented controls (**TB-665**)

| Control | Use when | ARIA / behavior | Do not use for |
| --- | --- | --- | --- |
| **`Tabs`** (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) | Fixed, peer views of one page (2–7 panels); selection swaps content below without navigation | `role="tablist"` / `tab` / `tabpanel`; `aria-selected`; Left/Right/Home/End keyboard; optional `?tab=` URL sync; default **`variant="pill"`** | One-time actions; unbounded lists; filters that narrow one list |
| **Primary `Button`** | Single commit actions (Save, Finalize, Export) | `button` | View switchers that swap large panels |
| **`FilterChip`** | Optional filters, drill-down links, compact toggles outside a tab strip | `button` or `link` | Mutually exclusive page sections with dedicated panels |
| **Segmented control** (`aria-pressed` / radiogroup) | 2–4 compact modes on one dataset where tab panels are not used (graph scope pills) | `aria-pressed` or `radiogroup` | Multi-panel layouts needing `tabpanel` linkage — use **`Tabs variant="pill"`** instead |

Cursor enforcement: `.cursor/rules/UI-Enterprise-Design-Standard.mdc` (**TB-120**).

---

## Reference links

- IBM Carbon Design System: https://carbondesignsystem.com/
- Carbon components (React): https://react.carbondesignsystem.com/
- Microsoft Fluent 2: https://fluent2.microsoft.design/
- Fluent UI React: https://developer.microsoft.com/en-us/fluentui
- Atlassian Design System: https://atlassian.design/
- GOV.UK Design System: https://design-system.service.gov.uk/

---

## Cross-references

- Backlog items: `docs/library/TECH_BACKLOG.md` **TB-114 – TB-120**, **TB-143 – TB-148** (in-app documentation presentation)
- **Rollout sequencing (Resolved 2026-05-30):** wave **0** primitives → **1** first-pilot + run detail → **2** Home/dashboard → **3** governance/audit → **4** polish — see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-30 (Enterprise UI design system rollout sequencing)*; do **not** big-bang all shared components in one pass.
- Product documentation presentation: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`
- Deferred UI architecture: `docs/library/UI_ARCHITECTURE_V1_1.md`
- Cursor rules: `.cursor/rules/UI-React-Next-Conventions.mdc`, `.cursor/rules/UI-Accessibility-Baseline.mdc`, `.cursor/rules/UI-Form-Validation-Affordances.mdc` (**TB-2005**)
- Agent guidance: `archlucid-ui/AGENTS.md`
- Page-scoped **Learn more** job match: this file § *Operator page contextual help — Learn more job match* (**TB-2048** Done); mount waves **TB-1666**–**TB-1670**; Digests/secondary remaps **TB-2049**–**TB-2052**
