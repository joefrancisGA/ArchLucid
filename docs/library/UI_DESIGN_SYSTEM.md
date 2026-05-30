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

### Components

- Prefer **structured enterprise cards, data tables, tabs, accordions, command bars, and side panels**.
- Status tags must be consistent and semantic:
  - `Ready` · `Needs attention` · `Blocked` · `Approved` · `Approved with monitoring`
- Primary content must be **visibly dominant**; diagnostics and supporting content must be **quieter** (lower contrast, smaller, collapsed by default).

### Language

Use precise product language throughout the UI — labels, headings, empty states, tooltips, and error messages:

| Preferred | Avoid |
|-----------|-------|
| Review package | Run, job, task |
| Finding | Issue, alert (unless it is an alert) |
| Residual risk | Open issue |
| Evidence trail | Logs, output |
| Signed decision record | Decision, result |
| Governance approval | Sign-off, approval |
| Audit trail | History |

### Technical details

- **Hide CLI/script/API/model/runtime details from normal product surfaces.**
- Keep technical details behind a "Diagnostics", "Technical appendix", or chevron-expandable disclosure.
- Developer-facing identifiers (run IDs, UUIDs, correlation IDs) are fine in copy mode or support contexts, not in primary operator UI.

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
> - Compact, readable enterprise spacing; no giant marketing cards in operator views.
> - Hide CLI/script/API/model/runtime details from normal surfaces.
> - Keep technical details behind diagnostics or technical appendix disclosures.
> - Use precise product language: review package, finding, residual risk, evidence trail, signed decision record, governance approval, audit trail.
> - Design for CIO/procurement/compliance credibility.

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
- Cursor rules: `.cursor/rules/UI-React-Next-Conventions.mdc`, `.cursor/rules/UI-Accessibility-Baseline.mdc`
- Agent guidance: `archlucid-ui/AGENTS.md`
