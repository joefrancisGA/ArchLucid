> **Scope:** Synthetic aggregate ROI bulletin sample. **FORBIDDEN (repository hygiene):** Do not append this document to `docs/CHANGELOG.md`. Do not add a `## YYYY-MM-DD — ROI bulletin signed:` section for this synthetic artefact. Sign-off audit format applies only to real published bulletins (see `docs/go-to-market/ROI_MODEL.md#aggregate-roi-bulletin-template`; `AGGREGATE_ROI_BULLETIN_TEMPLATE.md` alias).

> **Reviewed:** 2026-07-25
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — aggregate review-cycle baseline bulletin (SYNTHETIC EXAMPLE)

**Quarter:** Q1-2026 (illustrative label only)
**Generated:** (static sample — not tied to a live SQL window)
**Qualifying tenants (N):** 5 (synthetic floor matching the real minimum-N gate)

## Headline numbers (tenant-supplied baseline hours only)

| Metric | Hours | Note |
|--------|------:|------|
| Mean | 22.4 | illustrative sample |
| p50 | 20 | illustrative sample |
| p90 | 46 | illustrative sample |

## Interpretation guardrails

- These figures are **illustrative** so buyers can see table shape before **N ≥ 5** paying tenants with captured baselines exist.
- They are **not** ArchLucid runtime measurements and **not** SQL-sourced aggregates.
- Per-run sponsor deltas (findings histogram, audit counts, LLM calls) appear in first-value sponsor reports; this bulletin slice models **aggregate baseline hours** only.

## Related

- [`ROI_MODEL.md#aggregate-roi-bulletin-template`](ROI_MODEL.md#aggregate-roi-bulletin-template) (`AGGREGATE_ROI_BULLETIN_TEMPLATE.md` alias)
- [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)
- [`ROI_MODEL.md#synthetic-contoso-retail-case-study`](ROI_MODEL.md#synthetic-contoso-retail-case-study) — single-tenant synthetic sponsor narrative (DOCX-shaped metrics via `SyntheticCaseStudyDataProvider`)
