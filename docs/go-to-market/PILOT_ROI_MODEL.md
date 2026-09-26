> **Reviewed:** 2026-07-29

> **Scope:** Path-stable go-to-market alias for the Pilot ROI Model. Not an independent scorecard.

# ArchLucid Pilot ROI Model (alias)

**Last reviewed:** 2026-07-29

**Canonical measurement:** [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement).

**Library path alias:** [`../library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md).

Baseline questions, primary metrics, and scorecard live only in the pilot success scorecard. This file keeps bare `PILOT_ROI_MODEL.md` links under `docs/go-to-market/` stable for first-session and GTM callers.

For a committed run, the first-pilot proof collector writes `roi-measurement-evidence.json`
and `.md` alongside the first-value report. Copy
[`templates/roi-measured-outcomes.template.json`](templates/roi-measured-outcomes.template.json)
to `roi-measured-outcomes.json` in the proof directory and enter observed time
measurements with their source artifact. Missing or unobserved values remain
`INSUFFICIENT_DATA`; the report never infers dollar ROI from time differences.
