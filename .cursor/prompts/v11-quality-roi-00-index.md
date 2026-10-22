<!-- v11 quality-ROI Composer prompts — paste one prompt per session from
     docs/architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md. Do not implement
     from this index. Origin: 2026-09-09 v11 assessment (A) 81.64%. -->

# v11 quality-ROI — Composer prompt set (QR-26–QR-35)

v11 assessment: QR-01–QR-25 closed (QR-16–25 on `#2689`). Insight density is **76** (deficiency **312**) — remaining levers are **leftover 67-band `EvidenceRefs` + wiring the unused AS-057 scorer**, not DX-77. Best credit ROI is leftover citations (QR-26/27), then **AS-059 finding-wire support band (QR-28)**.

**Do not implement from this index.** Paste **one** numbered prompt from [`docs/architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md`](../../docs/architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md) per Composer / Cloud Agent session.

Suggested branches: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push `master`.**

## Run order

0. **Merge `#2689`** (rebase onto current `origin/master` if needed). Do not re-implement QR-16–QR-25.
1. **QR-26** — `dr-rpo-topology` + `requirement-sku-tier` product-shaped `EvidenceRefs`.
2. **QR-27** — dangling + premise-conflict `EvidenceRefs` (parallel with 26 if goldens isolated).
3. **QR-30** — AS-054 no-second-collector ratchet (parallel with 26).
4. **QR-31** — PCI DSS P1 `ga-starter` exact-id slice (parallel with 26; **not** ISO redo).
5. **QR-28** — support band on the finding wire + OpenAPI regen (DTO **does** change).
6. **QR-29** — Working desk shows the band (after 28).
7. **QR-32** — support band must not fuse into the density gate (after 28).
8. **QR-33** — Lane B support-ratio honesty when present (after 28).
9. **QR-34** — re-record `insight-density-engine-distribution.md` after 26–27.
10. **QR-35** — full `ci.yml` matrix triage (after golden/OpenAPI churn).

**Owner, not Composer:** enable merge queue; Gate 1 **with a bound snapshot**; G-REAL-06. **No DX-77.**

## Do not

- Add `EngineType` / coverage engines / 5th `AgentType`.
- Restore `typed-engine-protected` Promote bypass (ADR 0070).
- Change `DemotionThreshold` (stays 65).
- Re-run QR-01–QR-25, DX-01–DX-76, AS-049–AS-051, AS-056–AS-057 scorer bodies.
- Prefix-family `IsThemeEnabled` (PP-01 rejected).
- Fork a second Azure collector.
- GTM **M-90 / M-44 / M-91 / M-92**. Reopen **TB-135 / TB-136**.
- Collapse desktop review tabs behind **More**.
- Fake frontier transcripts or real-mode pilots.
- Regenerate OpenAPI unless a DTO changed (**QR-28 is the exception**).
- Redo ISO 27001 P1 (QR-20).

## Qualities these prompts move

| Quality | v11 score | Weight | Deficiency | Prompts |
|---------|----------:|-------:|-----------:|---------|
| Decision-Changing Insight Density | 76 | 13 | **312** | QR-26, QR-27, QR-32, QR-34 |
| AI / Agent Readiness | 78 | 10 | 220 | QR-28, QR-33 |
| Correctness & Evidence Integrity | 82 | 12 | **216** | QR-26, QR-27, QR-30 |
| Proof-of-ROI Readiness | 76 | 9 | 216 | **Owner:** Gate 1, G-REAL-06 |
| Time-to-Value | 81 | 10 | 190 | Already AS-050/051/052; Gate 1 owner |
| Differentiability / Defensibility | 87 | 13 | 169 | QR-31 |
| Runtime & First-Review Reliability | 77 | 7 | 161 | QR-35 |
| Sponsor / Operator Comprehension | 82 | 8 | 144 | QR-29 |
| Governed Review Integrity | 89 | 13 | 143 | QR-28, QR-29, QR-33 |
| Adoption Friction | 87 | 5 | 65 | (no prompt; freshness already `#2689`) |
