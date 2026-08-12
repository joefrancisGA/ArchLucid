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

### Capitalization

**Sentence case everywhere**, matching Carbon and Fluent: page titles, section headings, tabs, table column headers, buttons, links, status tags, empty states, and form labels. Capitalize only the first word plus proper nouns and product-surface names that are already capitalized elsewhere (Trust Center, Evidence graph, Architecture Decision Record). Never Title Case a heading or CTA (“Start Review” → “Start review”).

**After a colon**, capitalize when a complete sentence follows; stay lowercase when the colon introduces a fragment, value, or list. This follows the Microsoft Writing Style Guide, and matches Chicago's exception for a colon introducing one or more full sentences.

| Copy | Correct because |
|------|-----------------|
| `One lifecycle: Describe your architecture, then run a governed review.` | Two complete sentences follow the colon |
| `Demo workspace: Sample report output is available.` | Complete sentence follows the colon |
| `Source: finalized reviews in this workspace.` | Fragment, not a sentence |
| `Example: teams-governance-alerts-prod` | Value, not a sentence |
| `In-app alerts: enabled for active rules` | Fragment describing state |

This matters most where a bold lead label renders as its own element (for example `OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL` + `…_BODY` on Home): the label reads as detached, so a lowercase continuation looks like a defect rather than a grammatical choice.

**Preserve declared casing.** Vocabulary constants and status-tag copy own their capitalization — do not re-case them at the call site with CSS (`capitalize`, `uppercase`) or string transforms. The `text-xs uppercase` section-label token in `OPERATOR_TYPOGRAPHY` is the one sanctioned exception, and only for eyebrow/section labels.

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

### Error recovery contract (**TB-2155** — done 2026-08-10)

Golden-path operator error surfaces must help operators self-rescue before they open Report Problem. Every guarded failure root renders `OperatorErrorRecoveryContract` inline with three labeled lines:

| Line | Required content |
|------|------------------|
| **What failed** | Plain-language description of the failed action or load (may include API heading). |
| **What's intact** | Reassurance about drafts, committed records, or sibling workspace data that were not lost. |
| **Next step** | One concrete action — retry, switch workspace, open troubleshooting, or resubmit the form. |

Report Problem and correlation IDs remain for async/system escalation; recovery copy is **inline**, not toast-only. Vitest inventory: `error-recovery-contract-inventory.ts` + `error-recovery-contract-guard.test.ts`.

**Guarded roots (V1):** `ReviewPackageLoadFailureView`, `OperatorApiProblem`, `OperatorLayeredConnectivityError`, `OperatorMutationInlineError`.

### Operator page contextual help — mount + interaction contract (**TB-1666** — done 2026-08-09)

Every navigable operator surface must teach its own job in place. The shell top-bar Help Center is a global escape hatch, **not** a substitute for page-scoped help: an operator who does not already know the vocabulary cannot search for it.

| Rule | Required behavior |
|------|-------------------|
| Where required | Navigable operator hubs — every sidebar destination and every primary workflow page. Documented exceptions: auth / callback / error pages, pure redirects, and the Help Center itself. |
| Affordance | `PageContextualHelpButton` in the page header actions (CircleHelp + short caption), rendered **borderless** per § *Visible-boundary `Button` contract* → *Carve-out — page-header contextual help*. It must resolve a non-null topic via `pageHelpTopicForPathname` — a mounted button that renders `null` because the map row is missing is a **defect**, not a soft gap. |
| Content preference | Prefer Category-1 short answers from `contextualHelpForPathname` (what is this page / what to do next / why empty / where to configure). Fall back to a `/help/{slug}` link only when short answers are not written yet. |
| Trigger semantics | Help panels are **press-triggered**, never hover-triggered. They contain links and deep-link CTAs, and hover-only reveal makes those unreachable by keyboard and touch, and unusable on mobile. |
| Panel semantics | Use the shared `HelpPopover` primitive (`components/ui/help-popover.tsx`, layered on `components/ui/popover.tsx`). It supplies portaled collision-aware placement, `role="dialog"`, focus movement into the panel, Escape / outside-press dismissal, and focus return to the trigger. Do not hand-roll absolute positioning — it clips at the viewport edge and inside `overflow-hidden` ancestors. |
| Tooltip vs popover | `FieldHelpTooltip` for a short, **non-interactive** hint on a single control. `HelpPopover` whenever the content contains a link, CTA, or more than one idea. Never put interactive content in a tooltip. |
| Banned — `title` attribute | Never carry help text in a native `title` attribute. Browsers reveal it on mouse hover only, so keyboard and touch users never see it, and screen-reader support is inconsistent. This includes “why is this control disabled” copy, which must be visible near the control. Enforced by `no-restricted-syntax` in `eslint.config.mjs`; legacy surfaces are baselined in `eslint-rules/title-attribute-legacy-surfaces.mjs` and swept under **TB-2147**. |
| Banned — dead `helpKey` | `OperatorPageHeader` `helpKey` is deprecated and renders **no** affordance. Do not add new `helpKey` props as a help mechanism. |
| Supplements, not replacements | Field tooltips, `InAppHelpLink`, `InlineGlossaryChip`, and the `/reviews/new` wizard BookOpen drawer supplement page-scoped help. None of them satisfies this contract on their own. |

**Truncation reveal is a separate problem.** `<td className="truncate" title={fullText}>` is overflow recovery, not help, and it is still mouse-only. Prefer widening the column, wrapping, or a press-triggered disclosure; where a hover reveal is genuinely the best option, it needs a real tooltip. Tracked in **TB-2147** alongside the `title` sweep — do not treat it as ratified.

**Code touchpoints:** `PageContextualHelpButton` / `PageScopedContextualHelpPanel`, `page-help-topic-map.ts`, `contextual-help-registry.ts`, `components/ui/help-popover.tsx`, `components/ui/popover.tsx`.

**Good exemplars:** `/architecture/reviews`, `/architecture/architectures`, findings / alerts / alert-rules / advisory-scans, `/architecture/digests`, improvement planning, executive summary, readiness. Remaining mount gaps are owned by **TB-1667**–**TB-1669**; the Vitest allowlist + non-null topic guard is **TB-1670**. **Learn more** destinations are governed by the next section (**TB-2048**) — this section owns mount, trigger, and panel semantics only.

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

### Operator side rails (**TB-1572** — done 2026-08-11)

Carbon **side panels** (drawers / modal panels) remain valid for transient focus. This section owns **persistent right columns** on operator pages — the always-on second column agents invent as teaching rails, static scope columns, and empty two-col theater.

**Default:** single-column. A new operator page must **name a rail kind** below or stay single-column. Do not open a persistent right column “because Carbon has side panels” or “because another hub does.”

| Kind | Allowed? | When |
|------|----------|------|
| **Working-object sticky** | Yes | Sticky package / selection chrome that tracks the object the operator is acting on (e.g. run-detail package rail). |
| **Master-detail** | Yes | Browse list + detail pane where both panes are the page job (e.g. Digests browse). |
| **Live preview / readiness** | Yes, only when live | Draft/selection produces pin-worthy preview or readiness content. Hide or stack below when empty/sparse. **Done (TB-1574):** shared `operator-live-preview-readiness-rail` policy; Digests Schedule + Alert rules Rules tab stack when sparse and pin when live (coordinate residual whitespace **TB-1478**/**TB-1479** — do not reopen). |
| **TOC / wizard** | Yes | Help TOC or multi-step wizard navigation that is the reading/progress affordance. |
| **Teaching / workflow helper** | **Banned** as a persistent rail | Restates Next step or How-it-works beside the form. Demote to collapsed disclosure, inline tip, or remove. **Anti-exemplar Done (TB-1573):** Recurrence `RecurrenceSchedulesWorkflowHelperCard` is a collapsed `CollapsibleSection` (empty-hide already Done **TB-1133**). |
| **Static scope** | **Banned** as a persistent rail | Project + prose “scope” column that creates thin voids beside forms. Move inline near the field. **Anti-exemplar Done (TB-1573):** Advisory Schedules scope is inline on `AdvisoryScheduleCreateForm` (coordinate remaining whitespace **TB-1477** — do not duplicate that surface ticket). |
| **About aside** | **Banned** as a competing rail | Integration “about” columns that compete with `StatusTag` + page help. **Done (TB-1575):** inventory in `archlucid-ui/src/lib/operator/operator-side-rail-inventory.ts`; Teams/Slack/Azure Boards/ServiceNow demoted to single-column (disclosures or stacked setup StatusTags). |

**Layout rules when a rail is allowed:**

| Rule | Required behavior |
|------|-------------------|
| Shared shell | Sticky right column ~**17.5–18rem** wide (`w-70` / `w-72` class band); do not invent a third content column. |
| Empty / sparse | Hide the rail or stack its content below the primary column — never keep an empty two-col first viewport (pairs empty-state contract **TB-1552**–**TB-1556**; whitespace **TB-1477**–**TB-1482**). **TB-1574** Done for Digests Schedule + Alert rules live rails. |
| Primary CTA | No second primary in the rail. Page CTAs follow the operator primary-CTA contract (**TB-1539** and siblings). |
| Naming | In code review / PR notes, name the kind (`working-object`, `master-detail`, `live`, `toc-wizard`) or confirm single-column. |

**Out of scope here:** Marketing two-column layouts; Carbon modal side panels / drawers; Vitest allowlist guard (**TB-1576** — extend from `operator-side-rail-inventory.ts` checklist).

**UI architecture pointer:** `archlucid-ui/docs/ARCHITECTURE.md` § *Where to go next* — layout guidance cites this contract; do not treat two-column operator layouts as free-form.

### Operator primary CTA (**TB-1539** — done 2026-08-11)

Carbon and Fluent both enforce **one filled primary action** per viewport. This section owns **page-level** primary placement on operator hubs — not marketing/auth/help surfaces.

**Default:** name the page/tab job (Create schedule, Start review, Create subscription, …). Paint **exactly one** `Button` with `variant="primary"` and `size="sm"` in the **first viewport** (header actions + empty-state region combined).

| Rule | Required behavior |
|------|-------------------|
| One job | One primary action per page/tab — the commit that advances the page job. |
| Header order | `PageContextualHelpButton` → **primary** → outline utilities (Refresh, Preview, Export, …). |
| Empty alignment | Empty-state primary must be the **same job** as header primary — reuse the same handler or omit duplicate filled Create when header already exposes it. |
| Secondary demotion | Refresh / Preview / View* / Open* = `variant="outline"` or quiet text links — never a second filled primary beside Create/Start. |
| Related nav | Do not promote a related-nav link as empty `primary` when a Create/Start control exists for the page job. |
| Explicit variant | `EmptyState` / `EnterpriseCompactEmptyState` footer actions must set `variant` explicitly — do not rely on “index 0 = primary” unless that action is the page job. |
| Create panel open | When a create panel is revealed, form submit is the only primary; header Create hides or toggles closed — never two filled Creates. |

**Patterns (name in PR notes):**

| Pattern | When | Exemplar |
|---------|------|----------|
| **Header create reveals panel** | Empty-first collection hubs with a dense create form | Advisory Schedules (**TB-1542**), Recurrence (**TB-1540**) |
| **Header create always** | Browse/list hubs where create is lightweight | Digests browse (`digests-primary-action`) |
| **Header start** | Hub whose job is starting a workflow | Reviews hub (`runs-page-start-review`, **TB-1541**) |

**Out of scope here:** Marketing/auth/help CTAs; Vitest dual-primary guard (**TB-1544** — extend from `operator-primary-cta-inventory.ts`).

**UI architecture pointer:** `archlucid-ui/docs/ARCHITECTURE.md` § *Where to go next*.

### Operator empty states (**TB-1552** — done 2026-08-11)

Bans playful empties — this section defines **empty kinds**, Compact-vs-centered choice, first-viewport composition, and CTA/header alignment. CTAs follow the operator primary-CTA contract above (**TB-1539**).

**Name an empty kind:**

| Kind | Default chrome | When |
|------|----------------|------|
| **Collection** | `EnterpriseCompactEmptyState` | API returned zero rows for a list/inventory the page owns. |
| **Hub-zone** | `EnterpriseCompactEmptyState` | A tab/section of a multi-job hub has no data yet (e.g. Schedules tab empty). |
| **Filtered** | Compact + “no matches” copy | Filters/search yield zero rows while the backing collection is non-empty. |
| **Prerequisite** | Compact or inline callout | Operator must complete a prerequisite (scope, connection, finalized review) before the job can run. |
| **Permission** | Compact or helper text | Caller lacks mutation rank — no fake primary; explain read-only. |
| **Error** | `OperatorApiProblem` / alert — **not** an empty | Load/mutation failure must not paint as “no data yet.” |

**First-viewport composition (collection + hub-zone):**

| Rule | Required behavior |
|------|-------------------|
| Default | Page header + **Compact** empty (+ optional collapsed How-it-works). |
| Banned stacks | **No** always-on create form + side rail + dashed empty in the first viewport (whitespace **TB-1477**–**TB-1482**). **No** checklist + live preview + empty theater stacks. |
| Centered `EmptyState` | Reserve for rare full-page first-run where `gettingStarted` steps **are** the product — or fold steps into collapsed How-it-works under Compact. Dense operator hubs use Compact (**TB-1554** inventory). |
| Copy | Not-configured → “No {thing} yet” + one sentence on the page job — not playful illustration. |
| Presets | Reuse `archlucid-ui/src/lib/enterprise-compact-empty-state-presets.ts` and kind helpers in `operator-empty-state-kind-presets.ts` (**TB-1555**). |
| Migration inventory | Dense-hub allowlist: `archlucid-ui/src/lib/operator/operator-empty-state-migration-inventory.ts` (**TB-1554** Done); Vitest guard **TB-1556**. |

**Exemplars:** Digests browse (Compact under master-detail), Recurrence (empty footer Create + collapsed helper, **TB-1540**), Reviews hub (**TB-1553**), Advisory Schedules empty-first + header Create (**TB-1542**).

**Out of scope here:** Migrating every hub (**TB-1554**–**TB-1556**); nested compare/diff panel empties.

**UI architecture pointer:** `archlucid-ui/docs/ARCHITECTURE.md` § *Where to go next* — `OperatorEmptyState` remains valid for nested panels and server-page empty collections.

### Operator populated lists (**TB-1646** — done 2026-08-11)

`EnterpriseTable` + `StatusTag` are already mandated components — this section owns **which list kind** a populated operator surface must name, when cards are allowed, and when raw HTML tables are forbidden. Agents invent card stacks and parallel table dialects for the same inventory job without a kind.

**Default:** name a list kind below. New inventory / master-detail UIs use `EnterpriseTable` + `StatusTag` unless a kind below explicitly allows another pattern.

| Kind | Default chrome | When |
|------|----------------|------|
| **Inventory** | `EnterpriseTable` + `StatusTag` | Manage many same-shaped rows (schedules, rules, destinations, reviews). Primary columns = buyer labels; UUIDs / cron / hashes under disclosure. |
| **Master-detail** | `EnterpriseTable` (or equivalent list) + detail pane | Browse list + detail is the page job (e.g. Digests browse). Pair with side-rail kind **master-detail** (**TB-1572**). |
| **Entity-summary** | Cards only when justified | Low cardinality **and** nested detail that does not fit a row (history, multi-block body). Require `StatusTag`; no fake “Last triggered: unknown” theater. Document the justification in PR notes. Apply migrations: **TB-1647**. |
| **Config-checklist** | Checklist / boolean rows | One-time connection or trigger setup (e.g. Teams trigger checklist) — **not** destination inventory. |
| **Scale-table** | Sticky / virtualized table | Very large operator inventories (e.g. Audit) that need sticky headers or virtualization beyond default `EnterpriseTable` density. Keep `DESIGN_TOKENS.table`; do not invent a second table dialect. |

**Shared rules for every kind:**

| Rule | Required behavior |
|------|-------------------|
| Status | Use `StatusTag` (or `BooleanStatusChip` where boolean on/off is the status). Ban plain-text status columns on inventory hubs. |
| Row actions | ≤**2** visible row actions; overflow the rest into a menu. Hide disabled Delete unless actionable. Apply densify: **TB-1649**. |
| Buyer labels | Primary columns show human names / cadence / scope labels — not UUID Scope, mono cron, or hash theater (disclosure OK). |
| Raw HTML tables | **Banned** as a parallel dialect on operator hubs. Migrate Slack / Settings principals / ArtifactListTable-class tables onto `EnterpriseTable` (**TB-1648** / **TB-1649**). |
| CTAs / empties / rails | Page CTAs follow **TB-1539**; empties follow **TB-1552**; persistent right columns follow **TB-1572**. |

**Exemplar:** Digests browse / Recurrence / Reviews — `EnterpriseTable` inventory (or master-detail) with `StatusTag`.

**Anti-exemplars (apply siblings — do not reopen empty/not-configured clusters):** Advisory Schedules + Alert rules card stacks (**TB-1647**); Slack raw HTML + Webhooks spacious cards for the same destination-inventory job (**TB-1648**); action-dense Digest subscription rows / UUID-heavy Recurrence columns (**TB-1649**).

**Out of scope here:** Implementing every hub (owned by **TB-1647**–**TB-1650**); marketing tables; nested compare/diff grids.

**UI architecture pointer:** `archlucid-ui/docs/ARCHITECTURE.md` § *Where to go next* — list/table guidance cites this contract; do not invent card stacks or raw HTML tables for inventory jobs.

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
| `Tabs` / `EnterpriseTabs` | `archlucid-ui/src/components/ui/tabs.tsx` | Shared WAI-ARIA tabs (**TB-665**); **line-tab visual contract** (**TB-1661**); `variant="line"` is normative; `variant="pill"` is legacy until **TB-1662** strips overrides |

### Operator line tabs — visual contract (**TB-1661** — done 2026-08-12)

**Semantic rules** remain in § *Tabs vs buttons vs filter chips vs segmented controls* (**TB-665**). This section owns the **only allowed visual** for `<Tabs>` on operator and buyer-polished shells: IBM Carbon **line tabs** — full-width bottom rule, plain 13px labels, 2px teal active underline, no fill or radius on triggers.

| Rule | Required behavior |
|------|-------------------|
| Primitive | `<Tabs variant="line">` (styles in `tabs.tsx`). Until **TB-1662** migrates call sites, the shared default may still be `pill` — do **not** add new pill overrides or hand-rolled tab chrome. |
| `TabsList` | Horizontal: `border-b border-neutral-200` under the full strip. **Ban** `border-0` on `TabsList`, pill trays, `rounded-full` chip rows, segmented `rounded-md` containers, and folder-tab stacks. |
| `TabsTrigger` | Plain label text; active = `border-b-2` teal underline. **Ban** `rounded-full`, filled chip backgrounds, bordered pill chrome, and per-call-site `className` overrides that restyle triggers into pills, chips, or segmented trays. |
| Overflow | `whitespace-nowrap`, `shrink-0`, and a horizontal scroll wrapper on `TabsList` are allowed. Optional count badge **inside** the label only. |
| Buyer-polished shell | Same line-tab chrome as operator — no alternate pill dialect on polished surfaces. |
| Cross-route switchers | Route-level section changes (sidebar destinations, breadcrumbs) are **navigation** (`Link`, `aria-current`) — not `role="tab"`. |
| In-panel modes | 2–4 compact modes on one dataset without dedicated `tabpanel`s stay **segmented** (`aria-pressed` / radiogroup) per **TB-671** — not fake `Tabs`. |

**Gold exemplars (line-tab chrome):** `/architecture/digests` (`DigestsHubClient`), Settings roles (`SettingsRolesPageView`), `/architecture/reviews/new` (`ReviewsNewPathSwitcher`), review detail workspace tab strip.

**Code migration:** strip override classes and migrate remaining pill call sites under **TB-1662**–**TB-1665** (do not reopen Done **TB-665**–**TB-672** semantics work).

**Out of scope:** nested authoring mode switchers; Decision register Cards/Timeline; graph scope pills.

### Tabbed interfaces — filters and KPI strips (operator hubs)

| Pattern | When | Component / API |
| --- | --- | --- |
| **Section tabs** (Browse / Overview / Findings — swap panels below) | Fixed peer views of one page | `<Tabs variant="line">` per § *Operator line tabs* (**TB-1661**) |
| **List filters** (All / Needs attention — narrow one table) | Optional filters on one dataset | `FilterChip` + `buyerFilterChipClass` (`aria-pressed`) — **not** `Tabs` |
| **Read-only KPI strip** (Active / Finalized counts) | Summary metrics | `rounded-md` metric cards — **not** tabs; do not use `Tabs` or `FilterChip` |

**Rules:**

- List filters that narrow a single dataset stay on **`FilterChip`** even when they look like tabs — semantics differ (`aria-pressed` vs `role="tablist"`).
- Do **not** add one-off segmented containers or per-call-site pill/`className` overrides on `TabsTrigger` — use the shared line-tab primitive.

### Tabs vs buttons vs filter chips vs segmented controls (**TB-665**)

| Control | Use when | ARIA / behavior | Do not use for |
| --- | --- | --- | --- |
| **`Tabs`** (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) | Fixed, peer views of one page (2–7 panels); selection swaps content below without navigation | `role="tablist"` / `tab` / `tabpanel`; `aria-selected`; Left/Right/Home/End keyboard; optional `?tab=` URL sync; **`variant="line"`** visual per **TB-1661** | One-time actions; unbounded lists; filters that narrow one list |
| **Primary `Button`** | Single commit actions (Save, Finalize, Export) | `button` | View switchers that swap large panels |
| **`FilterChip`** | Optional filters, drill-down links, compact toggles outside a tab strip | `button` or `link` | Mutually exclusive page sections with dedicated panels |
| **Segmented control** (`aria-pressed` / radiogroup) | 2–4 compact modes on one dataset where tab panels are not used (graph scope pills) | `aria-pressed` or `radiogroup` | Multi-panel layouts needing `tabpanel` linkage — use **`Tabs variant="line"`** instead |

### Visible-boundary `Button` contract (**TB-2168**)

Every `Button` must have a **visible boundary** — a **border** or a **solid fill**. Tertiary, dismiss, cancel, and dense row actions use **`variant="outline"`** (border). Primary commit actions use **`primary`**; quiet filled actions use **`default`** / **`secondary`**; destructive actions use **`destructive`**.

**Banned:** `ghost` and `link` variants — they render with neither border nor fill and are indistinguishable from body copy on dense governance surfaces.

**Text-styled navigation** (wordmarks, inline “learn more”, help deep-links) uses **`OPERATOR_LINK`** / `<Link>` styling — not `Button variant="link"` or ghost `Button asChild` wrappers. Link-as-button carve-outs are tracked in **TB-1671**–**TB-1675**.

*Wordmark applied 2026-08-11:* the shell/marketing brand mark no longer sits inside `Button variant="outline"` (`OperatorShellTopBar`, `AppShellClient`, `ExecutiveShellFrame`, `MarketingPublicHeader`) — a bordered logo reads as an unstyled button. `ArchLucidWordmarkLink` now owns its own `focus-visible` ring; do **not** reintroduce a wrapper to supply focus styling.

**Borderless fills are intentional:** `primary`, `secondary`, `default`, and `destructive` stay **without** an extra neutral ring. Adding borders to filled variants would (a) read as a halo on teal/red fills, (b) need per-theme border tokens across four theme permutations, (c) contradict § *Color and surface* (“borders communicate state, not decorate”), and (d) converge button chrome with `Tabs variant="pill"` / `FilterChip` (**TB-665**). IBM Carbon Primary/Secondary/Danger buttons are borderless fills — ArchLucid follows that pattern for filled variants.

**Carve-out — page-header contextual help (owner decision 2026-08-11).** The page-header help trigger (`PageContextualHelpButton` / `PageScopedContextualHelpPanel`) is **borderless**: shared chrome in `components/usability/page-contextual-help-trigger.ts`, not a `Button` variant. Help is a reference affordance, not an action on the page's data. An outline made it a visual peer of real header actions (`Refresh`, `Save`), inflating the control cluster and out-ranking the primary CTA. Borderless demotes it to chrome, matching IBM Carbon and Azure Portal page-level help.

| Carve-out boundary | Rule |
|---|---|
| Scope | The page-header help trigger only. Do **not** generalize this to other tertiary controls — `ghost` and `link` `Button` variants stay banned. |
| Required affordance | Icon **plus** visible caption, with hover and focus-visible states. An **icon-only** borderless page help trigger is **not** covered by this carve-out. |
| Shell top bar | The persistent shell `Help` control (`OperatorShellTopBar`, `AppShellClient`) **keeps** `variant="outline"` — it is a global utility control with no competing page actions, and the border supplies its hit-target boundary. |

### Button / CTA width

Prefer **content-sized** buttons (`CTA_WIDTH.content` → `w-fit max-w-full`). Do not stretch short labels across a hero, pricing card, or wide card footer.

| Token | Use when |
| --- | --- |
| `CTA_WIDTH.content` | Card footers, heroes, short-label actions (default) |
| `CTA_WIDTH.formMatch` | Submit aligned to a full-width field in a narrow form/auth column (`w-full sm:w-auto`) |
| `CTA_WIDTH.listRow` | Stacked navigational hit-targets in a constrained rail/list only |

Code: `archlucid-ui/src/lib/design-tokens.ts` (`CTA_WIDTH`, `MARKETING_HERO_SECONDARY_CTA_CLASS`).

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

## Metric counts (TB-2152)

Headline counts on golden-path surfaces must be **self-describing** and **click-through faithful**:

- Render scope inline with the count using middle dots, e.g. `12 open findings · workspace · open`.
- Use `SelfDescribingMetricCount` + `metric-count-presentation.ts` helpers — do not hand-roll governance queue query strings.
- Click-through hrefs must reproduce the same filter contract (`buildGovernanceFindingsQueueHref`, `reviewFindingsGovernanceQueuePresentation`, etc.).
- Review-detail finding totals pair with governance queue rows scoped to the same `runId` and `recordKind=finding` only; decision rows are an intentional exception documented in parity tests.

---

## Cross-references

- Backlog items: `docs/library/TECH_BACKLOG.md` **TB-114 – TB-120**, **TB-143 – TB-148** (in-app documentation presentation)
- **Rollout sequencing (Resolved 2026-05-30):** wave **0** primitives → **1** first-pilot + run detail → **2** Home/dashboard → **3** governance/audit → **4** polish — see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-30 (Enterprise UI design system rollout sequencing)*; do **not** big-bang all shared components in one pass.
- Product documentation presentation: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`
- Deferred UI architecture: `docs/library/UI_ARCHITECTURE_V1_1.md`
- Cursor rules: `.cursor/rules/UI-React-Next-Conventions.mdc`, `.cursor/rules/UI-Accessibility-Baseline.mdc`, `.cursor/rules/UI-Form-Validation-Affordances.mdc` (**TB-2005**)
- Agent guidance: `archlucid-ui/AGENTS.md`
- Page-scoped help **mount + interaction** contract: this file § *Operator page contextual help — mount + interaction contract* (**TB-1666** Done) — press-only triggers, shared `HelpPopover`, `title`-as-help banned (sweep **TB-2147**); remaining mount waves **TB-1667**–**TB-1670**
- Page-scoped **Learn more** job match: this file § *Operator page contextual help — Learn more job match* (**TB-2048** Done); Digests/secondary remaps **TB-2049**–**TB-2052**
- Page-header help **borderless carve-out**: this file § *Visible-boundary `Button` contract* → *Carve-out — page-header contextual help* (owner decision 2026-08-11) — shared chrome in `components/usability/page-contextual-help-trigger.ts`; shell top-bar `Help` stays `variant="outline"`
- Operator **side rails** contract: this file § *Operator side rails* (**TB-1572** Done) — single-column default; allow working-object / master-detail / live-when-live / TOC-wizard; ban teaching / static-scope / about-aside persistent rails; live pin policy **TB-1574** Done; hub inventory + about-aside demotion **TB-1575** Done (`operator-side-rail-inventory.ts`); Vitest allowlist **TB-1576**
- Operator **primary CTA** contract: this file § *Operator primary CTA* (**TB-1539** Done) — one page job; ≤1 `variant="primary"` in first viewport; header order Help → Primary → outline utilities; hub inventory **TB-1543** Done (`operator-primary-cta-inventory.ts`); Vitest dual-primary guard **TB-1544**
- Operator **empty states** contract: this file § *Operator empty states* (**TB-1552** Done) — name empty kind; default collection/hub-zone → `EnterpriseCompactEmptyState`; ban form+rail+empty stacks; presets in `enterprise-compact-empty-state-presets.ts`; migration inventory **TB-1554** (`operator-empty-state-migration-inventory.ts`)
- Operator **populated lists** contract: this file § *Operator populated lists* (**TB-1646** Done) — name list kind; default inventory/master-detail → `EnterpriseTable` + `StatusTag`; entity-summary cards only when justified; ≤2 visible row actions; ban parallel raw HTML tables; apply **TB-1647**–**TB-1650**
- Operator **line tabs** visual contract: this file § *Operator line tabs — visual contract* (**TB-1661** Done) — Carbon line tabs only; ban pill/chip/segmented/folder overrides on `TabsList`/`TabsTrigger`; gold exemplars Digests / Settings roles / reviews new / review detail; code migration **TB-1662**–**TB-1665**
