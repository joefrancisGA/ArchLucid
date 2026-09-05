> **Scope:** Copy-paste Composer prompts that close **livelihood-kernel wave-12 load-bearing leftovers** after IS-01–15, LS-01–12, SD-01–12, and CR-01–12. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/livelihood-kernel-00-index.md`](../../.cursor/prompts/livelihood-kernel-00-index.md) (**LK-01–15**)
> **Wave 8:** [`INSTRUMENT_SPINE_COMPOSER_PROMPTS.md`](INSTRUMENT_SPINE_COMPOSER_PROMPTS.md) (**IS-01–15**)
> **Wave 9:** [`LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md`](LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md) (**LS-01–12**)
> **Wave 10:** [`SEALED_DESK_COMPOSER_PROMPTS.md`](SEALED_DESK_COMPOSER_PROMPTS.md) (**SD-01–12**)
> **Wave 11:** [`CAREER_RECORD_COMPOSER_PROMPTS.md`](CAREER_RECORD_COMPOSER_PROMPTS.md) (**CR-01–12**)
> **Shipped predecessors:** LI-01–15 (`master` #1397), LD-01–15 (#1421 / #1439), RS-01–15 (#1457), WA-01–24 (#1496), FD-01–13 (#1534 / #1537)

# Livelihood-kernel Composer prompts (LK-01–LK-15)

**Created:** 2026-09-05 · **Status:** ready to run **after IS + LS + SD + CR overlays exist in the tree** · **Do not re-run LI, LD, RS, WA, CD, AD, FD, IS, LS, SD, or CR** except as named leftovers. **IS-15 execution is superseded by LK-05–07.**

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. Waves 8–11 named the remaining kernel failures (XSS-readable Bearer, confirm-then-forever, two live URLs, trail as polish, wait-as-the-job) and **forbade** changing those bets from those files.

This set is **wave 12**. The owner authorized changing those load-bearing assumptions and **superseding ADRs**. Overlay chrome cannot substitute.

Paste **one** `.cursor/prompts/livelihood-kernel-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize first-run success, wizard collapse, wait-on-this-tab, confirm-then-forever, JS-held sessions, and a package that looks done.

Livelihood tools optimize a **document undo stack** on unsealed work, **one canonical URL** after spawn, a **session XSS cannot steal**, a **trail that gates the stamp**, wait as background, keyboard triage, a cited “no,” and a stamp that names its measured floor.

## Diagnosis → prompt

| Class | Prompt | Residual after IS + LS + SD |
|-------|--------|------------------------------|
| Career defense | **LK-01** | New ADR 0071 — working-document undo vs sealed amend |
| Career defense | **LK-02** | Draft editor has no undo/redo stack |
| One work object | **LK-03** | New ADR 0072 — canonical Working URL without merging tables |
| One work object | **LK-04** | Spawn-locked draft URL is still editor chrome |
| Career defense | **LK-05** | ADR 0059 P1 BFF cookie dual-mode (supersedes IS-15 P1) |
| Career defense | **LK-06** | P2: Working JS cannot read the access token |
| Career defense | **LK-07** | CSRF + server idle + meeting keepalive on the BFF |
| False confidence | **LK-08** | New ADR 0073 — trail is a finalize/export gate |
| False confidence | **LK-09** | Stamp/PDF/JSON fail closed without a complete trail |
| Throughput | **LK-10** | In-progress still makes wait the Working job |
| Throughput | **LK-11** | Keyboard still maps routes more than dispositions |
| Career defense | **LK-12** | Autosave last-write-wins clobbers the other tab |
| Career defense | **LK-13** | Infeasible still reads as unfinished yes in IA |
| False confidence | **LK-14** | Stamp does not name measured vs absent engines |
| Eval-first spine | **LK-15** | Default mock CI still trains buyer-polish as the desk |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **LK-01** ADR 0071 | Prefer first | Do not rewrite 0039 / 0050 |
| **LK-02** Document undo | After 01 | 01 Proposed or Accepted |
| **LK-03** ADR 0072 | After 01 or parallel | Do not rewrite 0068 |
| **LK-04** Canonical URL | After 03 | 03 Proposed in the same PR is OK |
| **LK-05 / 06 / 07** BFF | Dedicated PRs; 06 after 05; 07 after 05 | **Do not paste IS-15** |
| **LK-08** ADR 0073 | After 01 or parallel | Do not rewrite 0050 |
| **LK-09** Trail gate | After 08 | 08 Proposed/Accepted |
| **LK-10 / 11** | Independent after 04 | Do not fork IS-09 / IS-10 product or CR-06 Home heroes |
| **LK-12** | Independent | Do not fork CR-10 harness CI |
| **LK-14** | After CR-10 preferred | Stamp denominator; do not add a 40th engine |
| **LK-13** | Independent | LS-02 leftover IA; do not fork CR-09 empty presets |
| **LK-15** | Independent | Do not delete buyer golden-path suite |

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- 300-second *silent Undo toast* stays 300s; LK-01 adds a different primitive.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial remain eval sessions.
- Density gate method stays IS-05 (`typed-engine-scored`).
- Dual-pane shared selection stays LS-01.
- R12 what-if execute stays LS-06.
- Seat-scoped last-open prefs stay IS-13.
- Harness/catalog CI guard stays CR-10.
- Second-window honesty until BFF stays CR-05 (obsolete after LK-06).

## Global constraints

See [`.cursor/prompts/livelihood-kernel-00-index.md`](../../.cursor/prompts/livelihood-kernel-00-index.md). Same standing exclusions: no desktop **More** menu; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#. New ADRs need Trade-offs, Constraints, Expected impact. BFF keys in Terraform. SQL DDL in the single file per database.

## Do not re-run

- **IS-01–14** — wave 8; LK names leftovers only. **Do not paste IS-15.**
- **LS-01–12** / **SD-01–12** / **CR-01–12** — leftovers named; SD-09 and CR-05 obsolete after LK-05–07
- **FD-01–13** / **AD-01–12** / **CD-01–15**
- **WA-01–24** / **RS-01–15** / **LD-01–15** / **LI-01–15**
- **PT-01–20** / **WD-01–12** / **DD-01–10**
