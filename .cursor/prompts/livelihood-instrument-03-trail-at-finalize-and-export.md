# LI-03 — Transparency trail at Finalize and in the export packet

**Do not fork PT-08 or WD-02 for a second panel.** Reuse `TransparencyTrailPanel` and `RunDetailOverviewTransparencyTrail`. This file is the residual: **loud skipped MUST next to Finalize**, missing-trail defect, **export section**.

## Goal

Before Finalize, a Working-mode architect can answer “what did I assert, what did ArchLucid fill, which required questions did I skip?” from Overview **and** from the finalize control itself. A skipped MUST is loud. A completed review with no trail is a defect callout. Package Markdown/JSON export includes a Transparency trail section when those serializers already exist.

## Why

ADR 0050: the trail is mandatory. “If ArchLucid got it wrong, the user got it wrong” is only fair when the human can see asserted vs inferred before they seal. Overview already mounts the panel. That is not enough if skipped MUST is not next to Finalize, if the trail is collapsed into a feasibility appendix, or if the packet the architect emails omits it. Career risk without that record transfers liability to the person.

## Context

- ADR 0050: `docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`
- `archlucid-ui/src/components/feasibility/TransparencyTrailPanel.tsx`
- `archlucid-ui/src/components/reviews/RunDetailOverviewTransparencyTrail.tsx`
- Finalize CTA / review-package tab (`review-detail-workspace-tabs.ts` id `review-package`)
- Contracts: `AssertedTrailEntry`, `InferredTrailEntry`, `SkippedQuestionTrailEntry`
- LI-04 owns the **scorecard gate**. This prompt is visibility + export. If LI-04 has landed, do not add a second gate here.

## What to build

1. Working mode: trail **expanded** on Overview when present. Guided: available, not only in a technical appendix.
2. Skipped MUST **strip next to Finalize** for Working (visible list of unanswered required questions). Do not invent a parallel scorecard (LI-04).
3. Completed review with omitted trail: existing `missingTrailDefect` copy. Do not fake rows.
4. If package Markdown/JSON export already serializes sections, add a Transparency trail section. Do not invent a second PDF stack.
5. Hard vs soft: keep ADR 0050 rendering if verdict is on the payload. Do not invent `HardInfeasible` without a citation.
6. Vitest: Overview expanded in Working; skipped MUST strip present when trail has MUST skips; missing-trail defect; export includes trail section when serializers exist.

## Acceptance criteria

- Architect can answer asserted vs inferred from Overview without opening diagnostics.
- Skipped required questions are visible on the finalize path when the trail exists.
- Missing trail on a completed review is a visible defect.
- One UI: `TransparencyTrailPanel`.

## Constraints

- Do not claim Hard infeasible without a citation.
- Do not silently relax invariants in the UI.
- Tenant isolation unchanged; trail may contain user text — keep it in-tenant.
- Do not change `typed-engine-protected`.
