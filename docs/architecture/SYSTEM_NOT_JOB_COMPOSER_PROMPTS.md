> **Scope:** Copy-paste Composer prompts — System-not-job Composer prompts (SN-001–SN-040). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/system-not-job-00-index.md`](../../.cursor/prompts/system-not-job-00-index.md) (**SN-001–SN-040**)
> **Predecessor:** [`CAREER_GRAVITY_COMPOSER_PROMPTS.md`](CAREER_GRAVITY_COMPOSER_PROMPTS.md) (**CG**). **Do not re-run CG/SY.**
> **Successor:** [`LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md`](LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md) (**LN**). Envelope **runner** is [`CHEAP_EXPLORATION_COMPOSER_PROMPTS.md`](CHEAP_EXPLORATION_COMPOSER_PROMPTS.md).

# System-not-job Composer prompts (SN-001–SN-040)

**Created:** 2026-09-11 · **Status:** **shipped** (SN-001–SN-040) · Close audit: [`SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md`](SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md) · **Do not re-run** prior waves except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/system-not-job-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

**Code collision:** **SN** here is **system-not-job**. SecureNow brand remains [`SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md`](SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md) (**SN-01–SN-08**).

## The problem these prompts solve

ADR 0068 keeps two kernels. Start review spawn-locks a draft and creates a job. Compare still needs two committed manifests. All-day architects own a **system**; the product still makes them live in a **job**. Dual editors after spawn are a livelihood fork. ADR **0092** allows a labeled cheap envelope without merging tables or draft-diff Compare.

### Done test

After this wave:

1. Spawn-locked draft is not a writable Career editor.
2. Clone-from-snapshot is the desk sketch path.
3. Compare remains committed-manifest; labeled envelope runs allowed.
4. Working Home is not two peer start products.
5. Kernels unmerged.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + inventories | **SN-001–007** |
| Desk object / clone | **SN-008–030** |
| Ratchets / close | **SN-031–040** |

## Sequencing

See [`.cursor/prompts/system-not-job-00-index.md`](../../.cursor/prompts/system-not-job-00-index.md).

## Close audit (SN-040)

- [`SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md`](SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md) — done tests, cluster evidence, residuals.
- [`SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md`](SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md) — SN-038/039 explicit skips.
- Vitest ratchet: `archlucid-ui/src/lib/system-not-job-prompt-inventory.test.ts` (**SN-037** confirms 40 files + index).
- Out-of-wave skips: **SN-038** (draft-diff Compare), **SN-039** (live presence).

Load-bearing ADRs: **0092** ([`0092-working-cheap-what-if-envelope.md`](adrs/0092-working-cheap-what-if-envelope.md), SN-001); 0068/0072/0079 not rewritten.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial **remain** eval sessions.
- `AgentExecution:Mode` host default **Simulator** stays; Career vs Rehearsal is chrome + stamp (no G-REAL-06).
- No live presence / finding-comment chat / per-architecture ACL beyond RestrictToShares (0087).
- No 40th coverage engine.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes.
