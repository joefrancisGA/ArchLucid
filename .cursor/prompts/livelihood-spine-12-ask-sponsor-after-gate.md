# LS-12 — Ask and sponsor cannot read cleaner than the gate

**Do not fork IS-06, WA-07, or WA-08.** Stamp/print/JSON are IS-06. This file is leftover **Ask** and **sponsor KPI / ROI** surfaces that can still sound certain when the package is mostly checklist, quiet engines, or skipped MUST (blocked seal).

## Goal

After IS-05, Ask answers and sponsor summary / ROI tiles that are derived from findings must carry the same classification honesty: checklist is not Decision-grade; quiet engines are not “no findings”; skipped MUST is not hidden. If Ask has no package (LS-05), do not invent certainty.

## Why

If livelihoods depend on the sealed record, the artifact that leaves the building includes what the architect **says in the room** (Ask) and what the sponsor **screenshots**. SPA honesty that disappears in Ask/sponsor is evaluator polish.

## Context

- Ask review-questions UI + citations bound answers
- `architecture-sponsor-dashboard-evidence-copy.ts`
- Sponsor summary / scorecard tiles
- `FindingClassification` after the gate
- Quiet-engine hint / skipped MUST scorecard
- `PUBLIC_CLAIM_BOUNDARY_GUIDE.md`

## What to build

1. Ask: when the bound run’s findings are majority checklist or engines were quiet, the answer chrome includes the same coverage sentence used on the findings desk (reuse helpers from LS-03 / IS-06; do not fork a third honesty module).
2. Sponsor / ROI: do not lead with all-clear when checklist or skipped MUST would block or qualify the stamp.
3. Vitest: Ask fixture with only checklist findings does not claim Decision-grade coverage; sponsor fixture with quiet engines does not screenshot as no-findings.
4. Guided may keep simpler Ask; it must not be more certain than Working.

## Acceptance criteria

- Ask + sponsor cannot be cleaner than the review after the gate.
- Trail/skipped MUST already at stamp (FD-05) is not removed.
- No new coverage engine.

## Constraints

- Do not implement GTM **M-39** proof packets.
- Do not change the gate (IS-05).
- Do not unseal.
