<!-- v13 quality-ROI Composer prompts — paste one prompt per session from
     docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md. Do not implement
     from this index. Origin: 2026-09-10 v13 assessment (A) 83.44% Gate 5 FAIL. -->

# v13 quality-ROI — Composer prompt set (V13-01–V13-05)

v13 assessment (`origin/master` `9231d1990f`): **(A) 83.44%**. Gate 5 **FAIL**. V12-01–V12-04 bodies are **closed** (AS-094, wave 22 on trunk, Gate 1 runbook exists).

**Best token ROI:** **V13-01** land/finish typecheck (#2830) → **V13-02** skip if audit-matrix assert is green (#2829 merged) → **V13-03** four No-anchor cells → **V13-04** ci.yml triage. **Owner:** V13-05 Gate 1 + G-REAL-06.

**Do not implement from this index.** Paste **one** numbered prompt from [`docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md) or the matching `.cursor/prompts/v13-quality-roi-NN-*.md` file per session.

Suggested branches: `cursor/v13-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push `master`.** Model: **Composer 2.5 slow** (`composer-2.5`).

## Run order

1. **V13-01** — Restore `npm run typecheck`. **Do this first.**
2. **V13-02** — Audit-matrix share path templates (**skip if `assert_openapi_mutations_in_audit_matrix.py` exits 0** — #2829 merged).
3. **V13-03** — Close leftover No-anchor cells on four recorded engines.
4. **V13-04** — Full `ci.yml` matrix triage on a SHA that already has 01+02.
5. **V13-05** — Gate 1 checklist (owner executes the run; Composer verifies script/runbook).

## Do not

- Re-run QR-01–QR-35, V12-01–V12-04 bodies, AS-001–AS-094, DX-01–DX-76.
- Add `EngineType` / coverage engines / 5th `AgentType`.
- Flip `AgentExecution:Mode` host default (G-REAL-06).
- GTM **M-90 / M-44 / M-91 / M-92**. Reopen **TB-135 / TB-136**.
- Collapse desktop review tabs behind **More**.
- Start Wave 111+ robustness or SecureNow SA prompt packs as quality-ROI.
- Fake Gate 1 or G-REAL-06 runs.

## Qualities these prompts move

| Quality | v13 score | Weight | Deficiency | Prompts |
|---------|----------:|-------:|-----------:|---------|
| Runtime & First-Review Reliability | 68 | 7 | **224** | V13-01, then 02+04 |
| Decision-Changing Insight Density | 82 | 13 | **234** | V13-03 (small); **Owner:** G-REAL-06 |
| Proof-of-ROI Readiness | 76 | 9 | **216** | **Owner:** G-REAL-06 (not these prompts) |
| Correctness & Evidence Integrity | 85 | 12 | 180 | V13-01, V13-03 |
| Time-to-Value | 82 | 10 | 180 | V13-01; V13-05 execute |
| Governed Review Integrity | 92 | 13 | 104 | V13-02 |
| AI / Agent Readiness | 81 | 10 | 190 | **None** — TB-883 Hold |
