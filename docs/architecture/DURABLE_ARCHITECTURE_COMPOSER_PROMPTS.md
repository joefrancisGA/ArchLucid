> **Scope:** Copy-paste Composer prompts that close **durable-architecture wave-13** after LK-01–15. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files (wave 14):** [`.cursor/prompts/customer-architecture-00-index.md`](../../.cursor/prompts/customer-architecture-00-index.md) (**CA-01–50**)
> **Wave 13 skeleton (do not paste):** [`.cursor/prompts/durable-architecture-00-index.md`](../../.cursor/prompts/durable-architecture-00-index.md) (**DA-01–12**)
> **Wave 12:** [`LIVELIHOOD_KERNEL_COMPOSER_PROMPTS.md`](LIVELIHOOD_KERNEL_COMPOSER_PROMPTS.md) (**LK-01–15**)
> **Shipped predecessors:** LI-01–15 (`master` #1397), LD-01–15 (#1421 / #1439), RS-01–15 (#1457), WA-01–24 (#1496), FD-01–13 (#1534 / #1537)

# Durable-architecture Composer prompts (DA-01–DA-12)

**Created:** 2026-09-05 · **Status:** prompt skeleton on `master` (#1676). **Execution moved to wave 14** [`.cursor/prompts/customer-architecture-00-index.md`](../../.cursor/prompts/customer-architecture-00-index.md) (**CA-01–50**). **Do not paste DA-01–12** after CA exists. **Do not re-run LI, LD, RS, WA, CD, AD, FD, IS, LS, SD, CR, or LK** except as named leftovers. **Do not paste LK-05–07 / IS-15.**

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. Waves 8–12 closed start-product chrome, density-as-control, undo, canonical **review** URL after spawn, trail-as-gate, and (authorized) BFF session work.

This set is **wave 13**. The owner authorized productizing **`dbo.Architectures` as the customer-visible durable identity** without merging sealed reviews into drafts. Overlay chrome cannot substitute. Persistence already has the table (migration 323) and `ArchitectureIdentityService`; the desk still treats `DraftId` as `architectureId`.

**Do not paste DA files.** Paste **one** `.cursor/prompts/customer-architecture-NN-*.md` file per Composer session (wave 14). Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize a wizard, a demo compare, and a paged list of the last twenty runs.

Livelihood tools optimize a **named architecture** you reopen all week, **drafts and reviews as children**, **inventory that cannot silently omit row 21**, filters that **count what they hid**, wait that **rehydrates from the server**, and eval chrome that **stays off the paying desk**.

## Diagnosis → prompt

| Class | Prompt | Residual after LK |
|-------|--------|-------------------|
| One work object | **DA-01** | New ADR 0074 — customer-visible identity; do not rewrite 0068 |
| One work object | **DA-02** | Display name + `DraftRequests.ArchitectureId` FK |
| One work object | **DA-03** | List/get/ensure HTTP |
| One work object | **DA-04** | Working architecture desk (children + history) |
| One work object | **DA-05** | SPA stops using `architectureId` for `DraftId` |
| One work object | **DA-06** | Ensure identity on first draft save, not first Created-origin run |
| Throughput | **DA-07** | Showing N of M; Working list default 50 |
| Career defense | **DA-08** | Hidden-filter finding count |
| Eval-first spine | **DA-09** | Demo compare + wizard launcher gated to eval |
| Continuity | **DA-10** | Rehydrate in-flight from identity children |
| Career defense | **DA-11** | ADR/print cannot silently cap at 20 findings |
| One work object | **DA-12** | Conservative backfill (no SystemName merge) |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **DA-01** ADR 0074 | Prefer first | Do not rewrite 0068 / 0069 / 0072 |
| **DA-02** Schema | After 01 | 01 Proposed or Accepted |
| **DA-03** API | After 02 | 02 on the branch |
| **DA-06** Ensure on save | After 02–03 | Same PR as 03 is OK |
| **DA-05** Rename SPA ids | After 03 (wire) | 04 may land same PR if routes are decided |
| **DA-04** Desk | After 03 | 05 in the same PR is OK |
| **DA-12** Backfill | After 02–03, after 06 helper | Do not fuzzy-merge names |
| **DA-07 / 08 / 11** | Independent; 07/08 prefer after 04 | Do not fork LK-09 / LK-14 |
| **DA-09** | Independent | Do not fork LK-15 CI |
| **DA-10** | After 03–04 | Do not fork LK-10 wait chrome |

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- 300-second *silent Undo toast* stays 300s (ADR 0071 document stack stays on drafts).
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial remain eval sessions.
- Density gate method stays IS-05 (`typed-engine-scored`).
- BFF session stays LK-05–07.
- Draft conflict recovery stays LK-12 (keep local or reload — no merge engine).
- No live presence / finding-comment chat — collaboration is the shared identity + review history.
- No 40th coverage engine (`HOLD_NO_COVERAGE_ENGINES.md`).

## Global constraints

See [`.cursor/prompts/durable-architecture-00-index.md`](../../.cursor/prompts/durable-architecture-00-index.md). Same standing exclusions: no desktop **More** menu; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#. New ADRs need Trade-offs, Constraints, Expected impact. SQL in the single DDL file per database **and** a numbered migration.

## Do not re-run

- **LK-01–15** — wave 12; DA names leftovers only. **Do not paste LK-05–07.**
- **IS-01–15** / **LS-01–12** / **SD-01–12** / **CR-01–12**
- **FD-01–13** / **AD-01–12** / **CD-01–15**
- **WA-01–24** / **RS-01–15** / **LD-01–15** / **LI-01–15**
- **PT-01–20** / **WD-01–12** / **DD-01–10**
