> **Scope:** Copy-paste Composer/Cursor prompts that raise **v12 assessment** weighted qualities at the best credit ROI per token. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55-v12-post-wave22.md`](../assessments/LATEST_GPT55-v12-post-wave22.md) (v12, 2026-09-10) · **Index:** [`.cursor/prompts/v12-quality-roi-00-index.md`](../../.cursor/prompts/v12-quality-roi-00-index.md)
> **Predecessor:** [`V11_QUALITY_ROI_COMPOSER_PROMPTS.md`](V11_QUALITY_ROI_COMPOSER_PROMPTS.md) (QR-26–QR-35 — **closed on wave 22 branch**)
> **Do not re-run:** QR-01–QR-35 · AS-001–AS-093 · DX-01–DX-76

# v12 quality-ROI Composer prompts (V12-01–V12-04)

**Created:** 2026-09-10 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v12 scored **(A) 83.91%** on branch `cursor/as-prompt-queue-close-97a4` (wave 22 mechanism). v11's density + band + citation levers are **closed on that branch**. The highest **token ROI** remaining work is:

1. **V12-01 (AS-094)** — hub + global search honor `RestrictToShares` (~1 session, security-critical).
2. **V12-02** — merge wave 22 PR without re-implementing (~process + conflict fix only).
3. **V12-03 (QR-35 carry)** — triage full `ci.yml` matrix (~1–2 sessions, Runtime 77).
4. **Owner** — Gate 1 with bind + G-REAL-06 (no fake runs).

**Do not start wave 23 concurrent desk until V12-01 ships** — share leaks undermine the wave 22 close story.

**Run one prompt per chat.** Feature branch per prompt: `cursor/v12-<short-name>-97a4`. **Do not push `master`.**

## Why this set, not wave 23 or DX-77

| Quality | v12 score | Deficiency | What credits buy here |
|---------|---------:|----------:|-----------------------|
| Governed Review Integrity | 92 | **104** | V12-01 closes hub/search leak |
| Correctness & Evidence Integrity | 86 | 168 | V12-01 parity with API list filter |
| Runtime & First-Review Reliability | 77 | 161 | V12-03 triage only |
| Proof-of-ROI | 76 | **216** | **Owner:** Gate 1 + G-REAL-06 |
| Decision-Changing Insight Density | 82 | 234 | **Owner validation**, not more engines |

Wave 23 (concurrent desk / work-lease) is **high product value, low token ROI** — defer until V12-01–02 land.

## Do not re-run

| Item | Why |
|------|-----|
| QR-26–QR-34 | Distribution clean; band on wire; PCI P1 shipped on branch |
| AS-001–AS-093 | Wave 22 shipped except AS-094 |
| AS-089–AS-099 share API | Shipped — V12-01 is UI/hub only |
| DX-77 / new `EngineType` | Diminishing returns |
| G-REAL-06 host Mode flip | Owner forbidden |
| GTM M-90/M-44/M-91/M-92 | Human cohorts |
| TB-135 / TB-136 | Tech Done |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Qualities |
|--------|-------|-----------|------------|-----------|
| **V12-01** | AS-094 hub + search share filter | First | AS-091 API filter shipped | GRI, Correctness, Adoption |
| **V12-02** | Merge wave 22 PR to master | After 01 preferred | PR #2758 | All mechanism scores on trunk |
| **V12-03** | Full `ci.yml` matrix triage (QR-35) | After 02 | Trunk at wave 22 | Runtime |
| **Owner** | Gate 1 + G-REAL-06 | After 02 | Staging | Proof-of-ROI, Density validation |

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Share ACL is **inside** tenant (ADR 0087). **No SQL RLS**.
- **No new finding engine.** Do not add a 5th `AgentType`.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless a DTO changed — **V12-01 should not need OpenAPI**.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not collapse desktop review workspace tabs behind **More**.
- Do not flip `AgentExecution:Mode` host default. No G-REAL-06 fake Real runs.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files.

---

# V12-01 — AS-094 hub + global search honor RestrictToShares

**Closes:** v12 §5 weakness 3 · AS-094 residual
**Branch suggestion:** `cursor/v12-01-as094-hub-search-share-filter-97a4`
**Paste file:** [`.cursor/prompts/v12-quality-roi-01-as094-hub-search-share-filter.md`](../../.cursor/prompts/v12-quality-roi-01-as094-hub-search-share-filter.md)

### Design intent

`GET /v1/architectures` already passes `actorOid` and omits restricted packages. The **Architectures hub** uses `useArchitectureDraftListQuery` → `listDraftRequests({ mine: true })`, which can still surface titles the actor cannot View under RestrictToShares. Global search and home counts must apply the same rule. Reuse API filtering — do not duplicate share SQL in the UI.

**Done when:** hub cards, filter counts, and global search architecture hits cannot show restricted package titles to actors without View share.

---

# V12-02 — Merge wave 22 PR without re-implementation

**Closes:** v12 §5 weakness 4 · trunk lag vs branch mechanism
**Branch suggestion:** `cursor/v12-02-merge-wave22-closeout-97a4`
**Paste file:** [`.cursor/prompts/v12-quality-roi-02-merge-wave22-closeout.md`](../../.cursor/prompts/v12-quality-roi-02-merge-wave22-closeout.md)

### Design intent

PR `#2758` / `cursor/as-prompt-queue-close-97a4` carries wave 22. Goal is **merge readiness**: rebase onto current `origin/master`, resolve conflicts without re-implementing AS bodies, run scoped tests, update acceptance doc if master moved. **Do not** re-open AS-001–AS-093 implementation prompts.

**Done when:** PR is mergeable, OpenAPI snapshot + share tests + semantic band tests green on rebased branch.

---

# V12-03 — Full `ci.yml` matrix triage (QR-35 carry)

**Closes:** v12 Runtime 77 · v11 §8 weakness 9
**Depends on:** V12-02 (trunk at wave 22)
**Branch suggestion:** `cursor/v12-03-ci-yml-matrix-triage-97a4`
**Paste file:** [`.cursor/prompts/v12-quality-roi-03-ci-yml-matrix-triage.md`](../../.cursor/prompts/v12-quality-roi-03-ci-yml-matrix-triage.md)

### Design intent

Same as QR-35: dispatch or inspect latest full `ci.yml` on trunk; fix only cheap in-contract reds (docs link integrity, pre-corset guards, Azure extractor Pester). Do not disable checks. Do not conflate green OpenAPI fail-fast with green full matrix.

**Done when:** each remaining red is fixed, documented as flake, or explicitly owner-blocked with log links.

---

# V12-04 — Gate 1 staging checklist (owner-assisted, optional Composer)

**Closes:** Gate 1 UNKNOWN · v12 Proof-of-ROI blocker
**Owner-required:** real staging tenant and run
**Paste file:** [`.cursor/prompts/v12-quality-roi-04-gate1-ship-gate-checklist.md`](../../.cursor/prompts/v12-quality-roi-04-gate1-ship-gate-checklist.md)

### Design intent

Composer prepares a **repeatable checklist** and verifies `archlucid pilot ship-gate-evidence` accepts `--run-id` after a staging first review **with a bound inventory snapshot**. Composer does **not** fake Gate 1 PASS without a real run id.

**Done when:** owner has a documented runbook and one observed Gate 1 evidence bundle path — not a synthetic PASS.
