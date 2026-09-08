> **Scope:** Contributor-reference — wave-43 robustness controls for architecture create and review (branch `cursor/wave43-robustness-e14f`).

# Architecture create/review robustness — wave 43

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE42.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE42.md) (489–500 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 501 | Scoped proxy download **409 UX** | `downloads-blob-trigger-scoped-proxy.ts` |
| 502 | Audit CSV client **409 UX** | `audit-api.ts`, `audit-export-blocked-reason.ts` |
| 503 | Operator audit page export fail-closed | `use-audit-page-export.ts`, `AuditPageView.tsx` |
| 504 | Run-scoped audit CSV **409 parity** | `RunScopedAuditExportButton.tsx`, `audit-api.ts` |
| 505 | Review Ask stream fail-closed **409 UX** | `ask-sse-recovery.ts`, `ask-blocked-reason.ts`, `ReviewAskDock.tsx`, `AskMainPanel.tsx` |
| 506 | Ask hub + finding-ask fail-closed | `use-ask-page-stream.ts`, `FindingAskInlinePanel.tsx`, `finding-ask-blocked-reason.ts` |
| 507 | Finding LLM-audit API sealed-hash + **409** | `ExplanationController.FindingExplain.cs` |
| 508 | Finding explain panels fail-closed **409 UX** | `FindingExplainPanel.tsx`, `FindingExplainabilityTracePanel.tsx`, `finding-explain-blocked-reason.ts` |
| 509 | Tenant value-report ROI freshness | `PilotValueReport.cs`, `PilotValueReportService.cs`, `PilotValueReportExportControls.tsx` |
| 510 | Tenant value-report anchor export **409 honesty** | `use-pilot-value-report-pilot-page.ts` |
| 511 | ROI sponsor-report OpenAPI **409** (remaining) | `RoiController.cs` |
| 512 | Anchor-based export consolidation | `audit-api.ts`, `findings-api.ts`, `sponsor-roi-board-pack-api.ts`, `downloads-blob-trigger-browser.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave43ArchitectureTests.cs`.

**Hasher baseline note:** wave 43 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE44.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE44.md) (513–524).
