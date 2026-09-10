<!-- v10 quality-ROI Composer prompts — paste one prompt per session from
     docs/architecture/V10_QUALITY_ROI_COMPOSER_PROMPTS.md. Do not implement
     from this index. Origin: 2026-09-09 v10 assessment (A) 78.97%. -->

# v10 quality-ROI — Composer prompt set (QR-16–QR-25)

v10 assessment: QR-01–QR-15 shipped. Insight density is still **72** (deficiency **364**) — remaining levers are **ObservedFact merge + ARM on goldens**, not DX-77. Best credit ROI is **Correctness (78)** on OpenAPI snapshot red after AS-048, then AS-050 execute merge.

**Do not implement from this index.** Paste **one** numbered prompt from [`docs/architecture/V10_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V10_QUALITY_ROI_COMPOSER_PROMPTS.md) per Composer / Cloud Agent session.

Suggested branches: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push `master`.**

## Run order

1. **QR-16** — restore OpenAPI v1 snapshot + generated TS types. **Stop until fail-fast is green.**
2. **QR-17** — execute merges bound snapshot as ObservedFact (AS-050).
3. **QR-18** — 65-band goldens: product-shaped ARM/ARN/`diagram:`.
4. **QR-19** — `identity-blast-radius` ARM/ARN (parallel with QR-18 after QR-16).
5. **QR-20** — `ga-starter` ISO 27001 P1 slice.
6. **QR-21** — unbound estate-gap honesty (AS-051).
7. **QR-22** — bound snapshot freshness (AS-052).
8. **QR-23** — bind/unbind authz + audit + IDOR (AS-055).
9. **QR-24** — re-record `insight-density-engine-distribution.md` after 18–19.
10. **QR-25** — remaining path-engine citations.

**Owner, not Composer:** enable merge queue; Gate 1; G-REAL-06. **No DX-77.**

## Do not

- Add `EngineType` / coverage engines / 5th `AgentType`.
- Restore `typed-engine-protected` Promote bypass (ADR 0070).
- Change `DemotionThreshold` (stays 65).
- Re-run QR-01–QR-15, DX-01–DX-76, AS-019 / AS-035 / AS-049.
- Prefix-family `IsThemeEnabled` (PP-01 rejected).
- Fork a second Azure collector.
- GTM **M-90 / M-44 / M-91 / M-92**. Reopen **TB-135 / TB-136**.
- Collapse desktop review tabs behind **More**.
- Fake frontier transcripts or real-mode pilots.

## Qualities these prompts move

| Quality | v10 score | Weight | Deficiency | Prompts |
|---------|----------:|-------:|-----------:|---------|
| Decision-Changing Insight Density | 72 | 13 | **364** | QR-17, QR-18, QR-19, QR-24, QR-25 |
| Correctness & Evidence Integrity | 78 | 12 | **264** | QR-16, QR-23 |
| Time-to-Value | 77 | 10 | 230 | QR-17, QR-21, QR-22 |
| Differentiability | 85 | 13 | 195 | QR-20 |
| Runtime / AI | 74 / 76 | 7 / 10 | 182 / 240 | QR-16 |
