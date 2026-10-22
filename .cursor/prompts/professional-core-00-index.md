<!-- Professional-core Composer prompts — paste one prompt per session.
     Origin: 2026-09-06 livelihood diagnosis (ArchLucid is a working-architect tool;
     all-day use; livelihoods may depend on the sealed record). Wave 15 after
     customer-architecture-00-index.md (CA-01–50).
     Addresses kernel gaps overlays cannot fix: analytical floor, session,
     eval spine leakage, pipeline-as-job, room mediation, amend-after-toast,
     keyboard-as-work, route sprawl.
     Do not implement from this index. -->

# Professional-core mitigations — Composer prompt set (PC-01–PC-13)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

Waves 1–14 shipped **overlays and ADRs** (Working chrome, density gate ADR 0070, trail gate ADR 0073, document undo ADR 0071, canonical URL ADR 0072, customer identity ADR 0074). Many **kernel** prompts were written but **not executed** (notably **LK-05–07** BFF session) or remain **honesty-only** (stamp denominator, infeasible receipt, wait-as-background).

This set is **wave 15** — the Sept 2026 **paradigm gaps** diagnosis: chrome assumes a professional; the kernel still assumes an evaluator. Paste **one** `.cursor/prompts/professional-core-NN-*.md` file per Composer session.

**Status:** **Shipped** — PC-01–PC-13 on `master` (#1776–#1893). Wave close: [`docs/architecture/PROFESSIONAL_CORE_ACCEPTANCE_2026-09-06.md`](../../docs/architecture/PROFESSIONAL_CORE_ACCEPTANCE_2026-09-06.md) + `professional-core-acceptance-guard.test.ts`. **Do not re-run this set.** Fail-closed leftovers: [`defensible-record-00-index.md`](defensible-record-00-index.md) (**DR-01–DR-16**).

**Do not implement from this index.** **Do not treat as a V1 assessment scorecard.** No GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## Diagnosis → prompt (maps to Sept 2026 review)

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | **Analytical floor too thin** | **PC-01** | Stamp/export name catalog vs measured vs harness; fail closed on career export when floor unmet |
| 1 | **Analytical floor too thin** | **PC-02** | Intake MUST → engine inputs already in golden corpus (no 40th engine) |
| 2 | **Session is a consumer SPA** | **PC-03** | Execute **LK-05 → LK-06 → LK-07** (HttpOnly BFF); do not fork IS-15 |
| 3 | **Dual product spine** | **PC-04** | Working shell evicts eval/buyer chunks from mount graph + CI inventory |
| 3 | **Dual product spine** | **PC-05** | Monday desk = architecture portfolio; CA leftovers if identity list incomplete |
| 4 | **Pipeline not document** | **PC-06** | Read-only assumption delta vs last seal on same architecture (no billable run) |
| 4 | **Pipeline not document** | **PC-07** | CA route honesty: `ArchitectureId` ≠ `DraftId` in every Working deep link |
| 5 | **Wait is still the job** | **PC-08** | Execute in background; workbench + keyboard stay mounted (LK-10 completion) |
| 6 | **Collaboration designed out** | **PC-09** | Presenter answers append to **asserted** trail (R4 room; no avatars/chat) |
| 7 | **Career writes expire like toast** | **PC-10** | Amend disposition / record correction on list without toast window |
| 8 | **Keyboard bolted on mouse SPA** | **PC-11** | Working lands on Findings; palette work actions before nav rows |
| 9 | **Route sprawl** | **PC-12** | Sealed-records index + evidence naming + palette ⊆ Working nav |
| 1+7 | **False confidence on exports** | **PC-13** | Sponsor/ADR/print reuse PC-01 floor + quiet-engine sentences |

## Run order

**Kernel first:** **03** (session) in dedicated PRs. **01 → 02** (measurement honesty + intake wiring). **04 → 05 → 07** (identity desk). **08** (wait). **06** (delta panel; after 07). **09 → 10** (room + amend). **11 → 12 → 13** (keyboard + IA + exports).

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **PC-01** | First in analytics pair | LK-14 partial | CR-10 harness guard; no 40th engine |
| **PC-02** | After **01** preferred | R7/R8 packs | ID-11 gate method |
| **PC-03** | Dedicated PRs | — | **LK-05–07** bodies; IS-15 |
| **PC-04** | With **05** | LD-01 / LK-15 | Guided eval chrome |
| **PC-05** | After **07** if both | CA-25–38 | CA table merge |
| **PC-06** | After **07** | ADR 0074 desk | R12 billable branch (LS-06) |
| **PC-07** | With **05** | CA-20–24 | ADR 0068 merge |
| **PC-08** | After **03** for long finalize | LK-10 | CR-06 Home heroes |
| **PC-09** | Independent | FD-01 bridge | Live presence/chat |
| **PC-10** | Independent | CD-10 / WA-11 | 300s undo length |
| **PC-11** | After **08** | LK-11 / IS-10 | Single-letter shortcuts |
| **PC-12** | Independent | IA-006 / IA-011 | Desktop **More** menu |
| **PC-13** | After **01** | WA-08 / CD-06 | Fake transcripts |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- **Do not** hide desktop review tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs` tables. **Do not** unseal sealed records.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (ADR 0070 / IS-05).
- **Do not** add a 40th coverage-shaped engine or fake frontier transcripts.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS` (300).
- **Do not** invent live presence avatars or finding-comment chat.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary.
- Verification: focused Vitest + scoped C# tests; `.\scripts\ci\agent-compile-check.ps1` when C# changes.
- UI: Carbon density, sentence case, **TB-2005** form validation.
- BFF/session infra representable in **Terraform** (LK-05).

## Relationship to prior sets

| Set | Role |
|-----|------|
| **LK-05–07** | **PC-03 executes these** — do not paste IS-15 |
| **CA-01–50** | **PC-05 / PC-07** implement CA leftovers only |
| **LK-10 / LK-11 / LK-14** | **PC-08 / PC-11 / PC-01** complete or extend |
| **LI → FD waves** | Shipped overlays — do not re-run |

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **which kernel bet moved**, and which prior prompt set (if any) this supersedes for execution.
