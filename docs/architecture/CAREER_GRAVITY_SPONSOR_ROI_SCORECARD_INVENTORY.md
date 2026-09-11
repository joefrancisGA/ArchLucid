> **Scope:** Shrink-only inventory — sponsor dashboard, ROI, and review scorecard copy that can present Simulator KPIs as Career proof. **Do not rewrite KPIs here.** CG-034 / CG-035 / CG-091 own mutations.

> **Spine:** ADR **0091** · CG-003 · WS-06 · CG-009

# Career-gravity sponsor, ROI, and scorecard inventory

**Last reviewed:** 2026-09-11

Sponsors never open the chooser. KPI tiles are the packet.

## Leak classes

| Class | Meaning | Typical owner |
|-------|---------|---------------|
| **covered** | Sample vs live or Mode mix is already labeled | leftover if a tile skips it |
| **bypass** | KPI / savings reads as Career-complete with no rehearsal | CG-034 / CG-035 |
| **related** | Period-mix footnote (not per-run door) | CG-035 |
| **eval-ok** | Demo / sample ROI | leave |

## Tiles and reports

| Surface | Path | Sample vs live | Mode honesty | Leak class | Owner |
|---------|------|----------------|--------------|------------|-------|
| Sponsor report | `archlucid-ui/src/app/(operator)/insights/sponsor-report/page.tsx` | Value-report page | CG-035 strip + Rehearsal ROI qualifiers | **covered** | CG-035 / CG-091 |
| ROI summary | `archlucid-ui/src/app/(operator)/insights/roi-summary/_sections/RoiSummaryBuyerChrome.tsx` | Claim orientation | CG-035 strip on scoped ROI tiles | **covered** | CG-035 |
| Architecture scorecard | `archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView.tsx` | Pilot KPIs | CG-034 strip + rehearsal section qualifier | **covered** | CG-034 |
| Scorecard ROI panel | `archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardRoiPanel.tsx` | ROI panel | CG-034 strip context | **covered** | CG-034 / CG-035 |
| Scorecard outcomes | `archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPrimaryOutcomes.tsx` | Outcome tiles | Rehearsal / practice KPI labels | **covered** | CG-034 |
| ROI summary service | `ArchLucid.Application/Roi/SponsorRoiSummaryService.cs` | Aggregates | Period mix only (UI strip owns door honesty) | **related** | CG-035 |
| ROI history mix | `ArchLucid.Application/Roi/SponsorRoiHistoryRunModeCalculator.cs` | Real vs Simulator **run counts** | Period mix, not door | related | CG-035 |
| Mode honesty footnote | `ArchLucid.Application/Runs/StructuralExecutionModeHonesty.cs` | `RoiPeriodMixedModeFootnote` | Mix across period — **not** Rehearsal door | related | CG-035 |
| Sponsor ROI packet | `ArchLucid.Application/Exports/SponsorRoiPacketDispositionResolver.cs` | Packet disposition | Completeness, not door | related | CG-035 |
| First-value / sponsor PDF | `ArchLucid.Application/Pilots/FirstValueReportBuilder.cs` | Markdown | Assumed-banner (CG-003) | assumed-banner | CG-022 / CG-035 |
| Architecture sponsor copy | `archlucid-ui/src/lib/architecture/architecture-sponsor-dashboard-evidence-copy.ts` | Evidence links to Ask | Peer Insights hrefs | related | CG-091 |
| Baseline gate notice | `archlucid-ui/src/components/SponsorRoiBaselineGateNotice.tsx` | Baseline missing | Not rehearsal | eval-ok / related | CG-035 |

## Quoteable gaps

1. Scorecard and ROI tiles can show Simulator-period savings without a Rehearsal label. Sponsors do not see the Working chooser.
2. `RoiPeriodMixedModeFootnote` is **period mix** (Real + Simulator runs in a window). It is not Career vs Rehearsal door honesty.
3. List these independently of review-detail Ready (CG-002).

## Shrink rules

1. **Do not rewrite KPIs** from this inventory.
2. Ratchet: `career-gravity-sponsor-roi-scorecard-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host Mode flip.
- Demo sample ROI teaching.
