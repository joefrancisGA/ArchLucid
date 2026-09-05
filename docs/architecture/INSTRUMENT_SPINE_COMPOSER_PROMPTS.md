> **Scope:** Copy-paste Composer prompts that close **instrument-spine wave-8 load-bearing bets** after FD-01–13. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/instrument-spine-00-index.md`](../../.cursor/prompts/instrument-spine-00-index.md) (**IS-01–15**)
> **Wave 9:** [`LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md`](LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md) (**LS-01–12**) — leftovers after this set; do not fork IS
> **Wave 10 leftovers:** [`SEALED_DESK_COMPOSER_PROMPTS.md`](SEALED_DESK_COMPOSER_PROMPTS.md) (**SD-01–12**) — do not fork IS or LS
> **Wave 11 leftovers:** [`CAREER_RECORD_COMPOSER_PROMPTS.md`](CAREER_RECORD_COMPOSER_PROMPTS.md) (**CR-01–12**) — do not fork IS/LS/SD
> **Shipped predecessors:** LI-01–15 (`master` #1397), LD-01–15 (#1421 / #1439), RS-01–15 (#1457), WA-01–24 (#1496), FD-01–13 (#1534 / #1537)
> **Wave 5–7 leftovers:** [`CAREER_DESK_COMPOSER_PROMPTS.md`](CAREER_DESK_COMPOSER_PROMPTS.md), [`ALL_DAY_DESK_COMPOSER_PROMPTS.md`](ALL_DAY_DESK_COMPOSER_PROMPTS.md), [`FOUNDING_DESK_COMPOSER_PROMPTS.md`](FOUNDING_DESK_COMPOSER_PROMPTS.md) — do not re-run / do not fork

# Instrument-spine Composer prompts (IS-01–IS-15)

**Created:** 2026-09-05 · **Status:** ready to run **after FD-01–13** · **Do not re-run LI, LD, RS, WA, CD, AD, or FD.** Wave 9: [`LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md`](LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md) (**LS-01–12**). Wave 10: [`SEALED_DESK_COMPOSER_PROMPTS.md`](SEALED_DESK_COMPOSER_PROMPTS.md) (**SD-01–12**). Wave 11: [`CAREER_RECORD_COMPOSER_PROMPTS.md`](CAREER_RECORD_COMPOSER_PROMPTS.md) (**CR-01–12**).

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. Waves 1–7 closed overlay accidents (Working default, dirty guards, honesty lines, presenter loop). They **explicitly refused** to change `typed-engine-protected`, rewrite ADR 0067, or replace the create → execute → wait spine.

This set is **wave 8**. The owner authorized changing those three bets. Overlay chrome cannot substitute.

Paste **one** `.cursor/prompts/instrument-spine-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize first-run success, sample recovery, wizard collapse, wait-on-this-tab, confirm-then-forever, and a package that looks done.

Livelihood tools optimize **one resumable object**, **keyboard work**, **background pipelines**, **amendable writes**, **honest coverage on the stamp**, a cited “no,” a meeting that is a job, and a session that survives the day.

The remaining failures are load-bearing:

1. Two peer start jobs on the paying desk (ADR 0067).
2. Typed-engine findings always Decision-grade (`DeterministicInsightDensityGate` short-circuit).
3. Production identity still a mode matrix around an eval-first pipeline.

## Diagnosis → prompt

| Class | Prompt | Residual after FD-01–13 |
|-------|--------|-------------------------|
| One work object | **IS-01** | ADR 0067 still binds Working to two start products |
| One work object | **IS-02** | Home / nav / palette still show two peer CTAs |
| One work object | **IS-03** | Start / Alt+N still a chooser or Guided wizard |
| False confidence | **IS-04** | Miss clause forbids density as a production control |
| False confidence | **IS-05** | Gate short-circuits typed engines to Promote / Decision-grade |
| False confidence | **IS-06** | Seal / print / export ignore real classification |
| False confidence | **IS-07** | Findings desk has no first-class checklist band |
| Eval-first spine | **IS-08** | Eval grandfather inventory still drives production surfaces |
| Throughput | **IS-09** | In-flight exists; wait is still the job |
| Throughput | **IS-10** | Shortcuts still map more than they mutate |
| Career defense | **IS-11** | Meeting loop exists only as `?presenter=1` |
| Career defense | **IS-12** | Livelihood writes append-only after 300s |
| Continuity | **IS-13** | Last-open / last-visit are this-browser |
| Eval-first spine | **IS-14** | Drafts / sealed list / report duplication |
| Continuity | **IS-15** | sessionStorage Bearer + client idle (ADR 0059) |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IS-01** ADR 0069 | Prefer first | None — do not rewrite 0067 |
| **IS-02** / **IS-03** | After 01 | 01 Accepted (or Proposed in the same PR as 02 if tests need the rule) |
| **IS-04** ADR 0070 | After 01 or parallel | None — do not apply the gate until 05 |
| **IS-05** Gate | After 04 | 04 Proposed/Accepted |
| **IS-06** / **IS-07** | After 05 | 05 merged or same PR as 05 if tests share fixtures |
| **IS-08** / **IS-14** | After 02 | 01/02 for nav copy |
| **IS-09** / **IS-10** / **IS-11** | Independent after 03 | Do not fork FD-01 / FD-04 / FD-12 |
| **IS-12** / **IS-13** | Independent | CD-10 / AD-05 leftovers |
| **IS-15** BFF | Dedicated PR | Do not mix with copy/gate PRs |

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- ADR 0068 two kernels stay (synthesis is not review execute).
- Typed-engine **rows stay on the package** when they fail density — they become checklist, not deleted.
- Sealed records stay immutable (IS-12 is append-with-audit / reverse-disposition, not unseal).
- Guided / demo / trial remain eval sessions (IS-08 classifies call sites; it does not delete Guided).

## Global constraints

See [`.cursor/prompts/instrument-spine-00-index.md`](../../.cursor/prompts/instrument-spine-00-index.md). Same as FD except: **this wave may change** `typed-engine-protected` short-circuit and **supersede ADR 0067 for Working**. Still: no desktop **More** menu; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.

## Do not re-run

- **FD-01–13** — wave 7; IS-11 names discoverability leftover only
- **AD-01–12** / **CD-01–15** — IS-12/13/14 name leftovers only
- **WA-01–24** / **RS-01–15** / **LD-01–15** / **LI-01–15**
- **PT-01–20** / **WD-01–12** / **DD-01–10**
- **ID-01–11** — measurement shipped; IS-05 is the gate, not a new engine
- **LS-01–12** / **SD-01–12** / **CR-01–12** — leftovers; do not implement from IS files
