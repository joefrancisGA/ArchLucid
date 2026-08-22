> **Scope:** Contributor and coding-agent playbook for ArchLucid whitespace, density, and layout-width work. Not a buyer document. Does **not** replace [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).  
> **Audience:** engineers and AI coding agents working on `archlucid-ui/`.  
> **Last reviewed:** 2026-08-22.

# UI whitespace and layout sweep

Run this as a **controlled multi-pass sweep**, never as one “fix whitespace everywhere” change set. Each pass is a separate, reviewable wave with a named page batch.

The target is **better allocation of whitespace**, not simply more whitespace. Spend vertical rhythm on hierarchy and comprehension; do not widen gutters just because the viewport is large.

## Global rules (every pass)

- Reuse existing primitives: `OperatorPageContainer`, `OPERATOR_LAYOUT`, `OPERATOR_PAGE_CONTAINER`, `HELP_PAGE_LAYOUT`.
- Preserve enterprise information density — no consumer-SaaS marketing layouts inside operator surfaces.
- Do **not** add banned teaching/static right rails (see `operator-side-rail-inventory.ts`, **TB-1572**).
- Do **not** reopen closed empty-form+rail tickets (**TB-1477**–**TB-1482**).
- Operator app pages: avoid literal `space-y-6` / `space-y-8` / `py-8` except help/auth (**TB-2390**).
- Table/data surfaces: prefer `OperatorPageContainer` `full` or `dashboard` — not `reading` or ad-hoc `max-w-4xl`.
- Buyer-polished shells often hide operator vocabulary rails entirely; disclosures apply to the full operator shell.

### Width variants (`OperatorPageContainer`)

| Variant | Use when |
|---------|----------|
| `reading` | Help, long prose, narrow reference |
| `workflow` | Forms, wizards, governance workflow (~1200px) |
| `dashboard` | Tables, graphs, audit, compare, policy packs (~1440px) |
| `settings` | Administration prose bands (security-trust, tenant settings) |
| `full` | Shell-owned full bleed |

Shell max width stays `max-w-[1600px]` — do not nest duplicate `max-w-[1440px]` inside `variant="dashboard"`.

## Defect codes (Pass 1 audit)

| ID | Issue |
|----|--------|
| **SP-1** | Ad-hoc `max-w-*` instead of `OperatorPageContainer` |
| **SP-2** | Table-heavy page inside narrow parent (`max-w-4xl`) |
| **SP-3** | Redundant nested dashboard width caps |
| **SP-4** | Stacked vocabulary rails above work object |
| **SP-5** | Luxury vertical rhythm (`gap-10`, `mb-10`, `gap-8`) |

| ID | Heuristic |
|----|-----------|
| **H1** | Passive gutter / page too narrow for content type |
| **H2** | Table wrap from tight parent |
| **H3** | Hierarchy collapse |
| **H4** | Repetitive luxury padding |
| **H5** | Empty region (only if an allowed rail could help) |
| **H6** | Prose too wide |
| **H7** | Parallel facts stacked |
| **H8** | Always-expanded secondary chrome |
| **H9** | Primary action only at bottom |
| **H10** | Cards filling space without information gain |

## Pass plan

| Pass | Focus | Status (2026-08-22) |
|------|--------|------------------------|
| **1** | Audit only (`ux-audit-route-registry.ts` corpus) | Done |
| **2** | SP-1/SP-2 shared containers (audit, compare, provenance, finding detail) | Done |
| **3** | SP-4 `OperatorRelatedSurfacesDisclosure` + audit export header | Done |
| **4** | Governance workflow spacing, workspace-health hash, sponsor nested width | Done |
| **5** | Security-trust `settings`, run-detail disclosure + snapshot density | Done |
| **6** | Remaining ad-hoc widths (governance workflow container, policy packs list, graph/provenance loading) | In progress |
| **7** | Search/pattern library narrow surfaces (evaluate `workflow` vs `reading`) | Pending |
| **8** | Run-detail / policy-pack detail route shells (`max-w-[1200px]` stragglers) | Pending |
| **9** | Regression — `npm run ux-audit` screenshots at 1440/1920 | Pending |

## Shared primitive: related surfaces disclosure

Use `OperatorRelatedSurfacesDisclosure` for stacked vocabulary rails and capability strips above the primary work object. Pattern matches run-detail, audit, compare, evidence graph, and policy packs.

```tsx
<OperatorRelatedSurfacesDisclosure testId="page-related-surfaces-disclosure">
  <SomeVocabularyRail currentSurfaceId="…" />
</OperatorRelatedSurfacesDisclosure>
```

Keep page-specific coaching (e.g. `EvidenceGraphFirstOpenCoach`) **outside** the disclosure.

## Verification

- Scoped Vitest for touched surfaces (buyer-polished tests must still hide operator rails).
- `.\scripts\ci\agent-compile-check.ps1 -Ui` when UI types change.
- Pass 9: UX audit route registry screenshots before closing the sweep.

## References

- [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) — aesthetic and density norms  
- `archlucid-ui/src/lib/design-tokens.ts` — `OPERATOR_LAYOUT`, `OPERATOR_PAGE_CONTAINER`  
- `archlucid-ui/src/lib/operator/operator-empty-form-rail-whitespace-inventory.ts`  
- `archlucid-ui/src/lib/operator/operator-side-rail-inventory.ts`  
- `.cursor/skills/lucid-ui-audit/SKILL.md` — rating / audit workflow  
