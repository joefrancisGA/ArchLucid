<!-- v8 quality-ROI Composer prompts — paste one prompt per session from
     docs/architecture/V8_QUALITY_ROI_COMPOSER_PROMPTS.md. Do not implement
     from this index. Origin: 2026-09-09 v8 assessment (A) 76.95%. -->

# v8 quality-ROI — Composer prompt set (QR-01–QR-05)

**Status:** QR-01–QR-04 shipped. QR-05 still `#2641`. **Do not start a new v8 run.** Next pack: [`v9-quality-roi-00-index.md`](v9-quality-roi-00-index.md) / [`docs/architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md).

v8 assessment (archived): insight density rose 66 → 70 after DX-01–DX-76 and is still the largest weighted deficiency. **The remaining density lever is proof (G-REAL-06), not DX-77.** Best credit ROI was **Correctness (72)** + **Runtime (70)** on a red trunk.

**Do not implement from this index.** Paste **one** numbered prompt from [`docs/architecture/V8_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V8_QUALITY_ROI_COMPOSER_PROMPTS.md) per Composer / Cloud Agent session.

**QR-01 and QR-02 may share one PR.** Suggested branches: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push `master`.**

## Run order

1. **QR-01** — compile `Decisioning.Tests` (`DefaultGraphBuilder` 3-arg).
2. **QR-02** — advisory-surface guard `typed-engine-scored` (same PR as QR-01 preferred).
3. **QR-03** — OpenAPI v1 snapshot triage (after QR-01 compiles).
4. **QR-04** — `merge_group` + ruleset *draft* (owner still applies merge queue).
5. **QR-05** — `security-baseline` evidence refs (after push corset green).

**Stop.** Gate 1 + G-REAL-06 are owner. No DX-77.

## Do not

- Add `EngineType` / coverage engines / 5th `AgentType`.
- Restore `typed-engine-protected` Promote bypass (ADR 0070).
- Change `DemotionThreshold` (stays 65).
- Re-run DX-01–DX-76 or WK-01–WK-22.
- GTM **M-90 / M-44 / M-91 / M-92**. Reopen **TB-135 / TB-136**.
- Collapse desktop review tabs behind **More**.
- Fake frontier transcripts or real-mode pilots.

## Qualities these prompts move

| Prompts | Quality | v8 score |
|---------|---------|---------:|
| QR-01–QR-03 | Correctness & Evidence Integrity | 72 |
| QR-01, QR-04 | Runtime & First-Review Reliability | 70 |
| QR-05 | Decision-Changing Insight Density (honesty, not generation) | 70 |
