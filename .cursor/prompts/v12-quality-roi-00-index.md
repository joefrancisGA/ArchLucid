<!-- v12 quality-ROI Composer prompts — paste one prompt per session from
     docs/architecture/V12_QUALITY_ROI_COMPOSER_PROMPTS.md. Do not implement
     from this index. Origin: 2026-09-10 v12 assessment (A) 83.91% post wave 22. -->

# v12 quality-ROI — Composer prompt set (V12-01–V12-04)

v12 assessment (branch `cursor/as-prompt-queue-close-97a4`): wave 22 mechanism **83.91%**. QR-26–QR-34 and AS-001–AS-093 are **closed on branch**. Insight density table is clean (`No evidence = 0`). Semantic support band is on the wire and Working desk.

**Best token ROI:** **V12-01 (AS-094)** hub/search share filter → **V12-02** merge wave 22 → **V12-03** ci.yml triage. **Owner:** Gate 1 + G-REAL-06.

**Do not implement from this index.** Paste **one** numbered prompt from [`docs/architecture/V12_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V12_QUALITY_ROI_COMPOSER_PROMPTS.md) or the matching `.cursor/prompts/v12-quality-roi-NN-*.md` file per session.

Suggested branches: `cursor/v12-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push `master`.**

## Run order

1. **V12-01** — AS-094 hub + global search honor RestrictToShares. **Do this first.**
2. **V12-02** — Rebase/merge wave 22 PR (#2758) onto current master without re-implementing AS bodies.
3. **V12-03** — Full `ci.yml` matrix triage (QR-35 carry) on post-merge trunk.
4. **V12-04** — Gate 1 staging checklist (owner executes the run; Composer documents/verifies script path).

**Defer wave 23 concurrent desk until V12-01 ships.**

**Owner, not Composer:** enable merge queue; G-REAL-06 two-pack pilots; G-REAL-07 proof packets. **No DX-77.**

## Do not

- Re-run QR-01–QR-35, AS-001–AS-093, DX-01–DX-76 bodies.
- Add `EngineType` / coverage engines / 5th `AgentType`.
- Flip `AgentExecution:Mode` host default (G-REAL-06).
- GTM **M-90 / M-44 / M-91 / M-92**. Reopen **TB-135 / TB-136**.
- Collapse desktop review tabs behind **More**.
- Regenerate OpenAPI on V12-01 (no DTO change expected).
- Fake Gate 1 or G-REAL-06 runs.

## Qualities these prompts move

| Quality | v12 score | Weight | Deficiency | Prompts |
|---------|----------:|-------:|-----------:|---------|
| Governed Review Integrity | 92 | 13 | **104** | V12-01 |
| Correctness & Evidence Integrity | 86 | 12 | 168 | V12-01 |
| Runtime & First-Review Reliability | 77 | 7 | 161 | V12-03 |
| Proof-of-ROI Readiness | 76 | 9 | **216** | **Owner:** V12-04 execute |
| Decision-Changing Insight Density | 82 | 13 | 234 | **Owner:** G-REAL-06 |
| Adoption Friction | 88 | 5 | 60 | V12-01 |
| All mechanism on trunk | — | — | — | V12-02 |
