# API controller area map

`ArchLucid.Api/Controllers/` groups endpoints by **bounded context** using **physical area folders** and matching namespaces `ArchLucid.Api.Controllers.{Area}`.

| Area folder | Namespace | Controllers |
|-------------|-----------|-------------|
| **`Authority/`** | `ArchLucid.Api.Controllers.Authority` | `RunsController` (+ `RunsController.Logging`, `RunsController.AgentEvaluation`), `AuthorityQueryController`, `AuthorityReplayController`, `AuthorityCompareController`, `AuthorityRunEventsController`, `RunComparisonController`, `AnalysisReportsController`, `ExportsController`, `ArtifactExportController`, `DocxExportController` |
| **`Governance/`** | `ArchLucid.Api.Controllers.Governance` | `GovernanceController`, `GovernancePreviewController`, `GovernanceResolutionController`, `PolicyPacksController`, `ManifestsController` — plus request DTOs: `AssignPolicyPackRequest`, `CreatePolicyPackRequest`, `PublishPolicyPackVersionRequest`, `GovernanceApprovalBatchReviewRequest`, `GovernanceBatchReviewResponse` |
| **`Alerts/`** | `ArchLucid.Api.Controllers.Alerts` | `AlertsController`, `AlertRulesController`, `AlertRoutingSubscriptionsController`, `AlertSimulationController`, `AlertTuningController`, `CompositeAlertRulesController`, `AlertsAcknowledgeBatchRequest`, `AlertsAcknowledgeBatchResponse` |
| **`Admin/`** | `ArchLucid.Api.Controllers.Admin` | `AdminController`, `DiagnosticsController`, `JobsController`, `VersionController`, `DemoController`, `ScopeDebugController`, `AuthDebugController`, `DocsController`, `AuditController` — plus `AdminArchiveRunsByIdsRequest`, `AdminArchiveRunsBatchRequest` |
| **`Advisory/`** | `ArchLucid.Api.Controllers.Advisory` | `AdvisoryController`, `AdvisorySchedulingController`, `LearningController`, `RecommendationLearningController`, `ProductLearningController`, `DigestSubscriptionsController` |
| **`Evolution/`** | `ArchLucid.Api.Controllers.Evolution` | `EvolutionController` |
| **`Planning/`** | `ArchLucid.Api.Controllers.Planning` | `GraphController`, `ProvenanceController`, `ProvenanceQueryController`, `ComparisonController`, `ComparisonsController`, `RetrievalController`, `AskController`, `ConversationController`, `ExplanationController` |

**Bulk operator APIs (2026-04-15):**

- `POST /v1/admin/runs/archive-by-ids` — partial-success archival by run id (max 100).
- `POST /v1/governance/approval-requests/batch-review` — approve or reject many requests (max 50, partial success).
- `POST /v1/alerts/acknowledge-batch` — acknowledge many alerts in scope (max 100, partial success).
- `POST /v1/admin/diagnostics/data-consistency/orphan-golden-manifests` — dry-run or delete orphan `GoldenManifests` (max 500; removes `ArtifactBundles` first).
- `POST /v1/admin/diagnostics/data-consistency/orphan-findings-snapshots` — dry-run or delete orphan `FindingsSnapshots` not referenced by a golden manifest (max 500).
