> **Scope:** Residual multi-tenant isolation — mapping uncovered SQL surfaces to compensating controls (extends `MULTI_TENANT_RLS.md`).
>
> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Multi-tenant RLS — residual risk matrix

## 1. Objective

Give operators and security reviewers a **single table-style view** of SQL surfaces that **do not** participate in `rls.ArchLucidTenantScope`, the **primary compensating control** already in production code, and how **monitoring / process** reduces residual lateral-movement risk.

## 2. Assumptions

- Application-layer scope enforcement (`IScopeContextProvider`, governance APIs) remains authoritative for business authorization.
- In `SystemWithPerTenantCatalogs` (production) mode, the database boundary provides sufficient tenant isolation. RLS is not required for defense-in-depth and this matrix describes optional hardening only. In `SingleCatalog` (dev/test) mode, the compensating controls below remain relevant.
- Operational jobs sometimes require **`al_rls_bypass`**; those paths are gated and audited separately.

## 3. Constraints

- Child tables keyed only by technical identifiers (`RunId`, `SnapshotId`, …) cannot reuse the standard predicate **without denormalizing scope** or introducing barrier views (migration cost + query-shape risk).
- The matrix is **not** a SOC attestation; it informs backlog prioritization and risk acceptance packets (`RLS_RISK_ACCEPTANCE.md`).

## 4. Architecture overview

**Nodes:** SQL tables partitioned into **covered-by-RLS**, **tenant-only predicate**, and **uncovered**.

**Edges:** API requests → repositories → parameterized SQL → optional SESSION_CONTEXT → row visibility.

**Residual slice:** uncovered tables rely on **join discipline**, **repository scope filters**, and **least-privilege SQL identities**, not predicate enforcement.

## 5. Component breakdown

| Bucket | Examples (non-exhaustive) | Enforcement expectation |
|--------|---------------------------|-------------------------|
| Covered scope triple | `dbo.Runs`, `dbo.ContextSnapshots`, `dbo.FindingsSnapshots`, `dbo.GoldenManifests`, `dbo.AuditEvents`, digest + alert core tables | RLS predicate + session context |
| Tenant-only rows | `dbo.SentEmails`, trial/onboarding tables per migrations **096** / **097** | Tenant predicate variant |
| Uncovered legacy / child graph | `dbo.ArchitectureRequests`, string-run pipeline tables, `dbo.GraphSnapshots`, `dbo.FindingRecords`, bundle bridges without scope columns | Application joins + explicit `TenantId` filters in repositories |

## 6. Data flow

1. Happy path: Request resolves tenant/workspace/project → repositories include scope predicates → SQL returns only in-scope rows.
2. Residual path: Query touches uncovered child → correctness depends on **join keys anchored to a scoped parent** (for example, manifest or run rows that are themselves scoped) and **code review** preventing orphan reads.
3. Jobs / migrations: Bypass ambient toggles explicit elevated context; operators follow runbooks to avoid accidental cross-tenant reads.

## 7. Security model

**Strengths:** Covered tables gain automatic deny-by-default filtering when session context is wrong.

**Weaknesses:** Uncovered tables remain vulnerable to **missing WHERE clauses** or **ID-guessing** if an attacker obtains raw identifiers without passing scoped parent lookups.

**Mitigations (design intent):**

- Repository APIs accept scope explicitly; integration tests cover cross-tenant negatives where SQL fixtures exist (`RlsArchLucidScopeIntegrationTests`, pool-recycling isolation tests).
- Operational telemetry flags orphan anomalies (`DataConsistencyOrphanProbeExecutor`) for GoldenManifests / FindingsSnapshots / ContextSnapshots / GraphSnapshots.

**Trade-off:** Full RLS on every child table increases migration churn and can complicate predicate eligibility; staged denormalization (pattern established in DbUp **046**) is the scalable bridge.

## 8. Operational considerations

| Residual surface | Primary compensating control | Monitoring / evidence |
|------------------|------------------------------|------------------------|
| Legacy architecture strings (`ArchitectureRequests`, `ArchitectureRuns`, …) | API-only access; no ad-hoc reporting accounts | API audit + scoped integration tests |
| Graph snapshots without triple | Join via scoped parents only | Orphan probe counts + optional auto-remediation for graph snapshots |
| Finding rows keyed by snapshot | Scoped via parent findings snapshot | Same orphan probes for findings snapshots |
| Background operational tables (`BackgroundJobs`, leases) | Dedicated job identities + manual review | Host metrics / job dashboards |

**Cost:** Engineering time to extend denormalized scope vs. sustained reliance on repository discipline.

**Scalability:** Predicate simplicity on covered tables preserves plan stability; expanding coverage follows the **046** pattern (add columns + backfill + policy ALTER).

**Reliability:** Pool recycling requires session context refresh — documented in `MULTI_TENANT_RLS.md` pool notes.

**Terraform / IaC:** RLS DDL ships via DbUp and mirrors in `ArchLucid.sql`; policy **STATE** toggles remain operational procedures, not Terraform-managed runtime switches.

## 9. Executable drift guard classifications

`scripts/ci/assert_rls_residual_risk_classifications.py` treats this table as the executable allowlist. Any current `CREATE TABLE dbo.*` in `ArchLucid.Persistence/Scripts/ArchLucid.sql`, or newly changed forward migration table in CI, must appear in exactly one row below.

| Classification | Tables | Classification basis |
|----------------|--------|----------------------|
| `rls-covered-scope-triple` | `dbo.Runs`, `dbo.ContextSnapshots`, `dbo.FindingsSnapshots`, `dbo.DecisioningTraces`, `dbo.GoldenManifests`, `dbo.GoldenManifestAssumptions`, `dbo.ArtifactBundles`, `dbo.AuditEvents`, `dbo.ProvenanceSnapshots`, `dbo.ConversationThreads`, `dbo.RecommendationRecords`, `dbo.RecommendationLearningProfiles`, `dbo.AdvisoryScanSchedules`, `dbo.AdvisoryScanExecutions`, `dbo.ArchitectureDigests`, `dbo.DigestSubscriptions`, `dbo.DigestDeliveryAttempts`, `dbo.AlertRules`, `dbo.AlertRecords`, `dbo.AlertRoutingSubscriptions`, `dbo.AlertDeliveryAttempts`, `dbo.CompositeAlertRules`, `dbo.PolicyPacks`, `dbo.PolicyPackAssignments`, `dbo.PolicyPackChangeLog`, `dbo.RetrievalIndexingOutbox`, `dbo.IntegrationEventOutbox`, `dbo.AuthorityPipelineWorkOutbox`, `dbo.ArchitectureRunIdempotency`, `dbo.ProductLearningPilotSignals`, `dbo.ProductLearningImprovementThemes`, `dbo.ProductLearningImprovementPlans`, `dbo.EvolutionCandidateChangeSets`, `dbo.BillingSubscriptionStateHistory`, `dbo.TenantHealthScores`, `dbo.ProductFeedback`, `dbo.FindingFeedback`, `dbo.ConfluencePublishingTargets`, `dbo.ConfluencePublishJobs`, `dbo.CorePilotTeamChecklist`, `dbo.PilotCloseouts` | Standard `rls.archlucid_scope_predicate` policy entries on tenant/workspace/project columns, with `ScopeProjectId` where documented for run-shaped rows. |
| `tenant-only-covered` | `dbo.LlmDailyTenantTokenWindowState`, `dbo.LlmMonthlyTenantBudgetState`, `dbo.SentEmails`, `dbo.TenantLifecycleTransitions`, `dbo.TenantTrialSeatOccupants`, `dbo.TenantOnboardingState` | Tenant-id predicate variant; no workspace/project columns are present on these rows. |
| `database-per-tenant/system-plane-only` | `dbo.Tenants`, `dbo.TenantWorkspaces`, `dbo.Projects`, `dbo.IdentityUsers`, `dbo.BillingSubscriptions`, `dbo.BillingWebhookEvents`, `dbo.TenantNotificationChannelPreferences`, `dbo.TenantExecDigestPreferences`, `dbo.TenantTeamsIncomingWebhookConnections`, `dbo.TenantItsmOutboundSettings`, `dbo.ScimTenantTokens`, `dbo.ScimUsers`, `dbo.ScimGroups`, `dbo.ScimGroupMembers`, `dbo.AdminNotifications`, `dbo.MarketingPricingQuoteRequests`, `dbo.AzureExtractorPackages` | Tenant registry, workspace-scoped architecture project rows (`dbo.Projects`), identity, billing, integration configuration, SCIM, admin notification, quote intake, or extractor package control-plane data; production tenant isolation is the database boundary per topology doc. |
| `child-table-with-compensating-control` | `dbo.AgentTasks`, `dbo.AgentResults`, `dbo.AgentEvidencePackages`, `dbo.AgentExecutionTraces`, `dbo.AgentOutputEvaluationResults`, `dbo.RunExportRecords`, `dbo.ComparisonRecords`, `dbo.DecisionNodes`, `dbo.AgentEvaluations`, `dbo.ContextSnapshotCanonicalObjects`, `dbo.ContextSnapshotCanonicalObjectProperties`, `dbo.ContextSnapshotWarnings`, `dbo.ContextSnapshotErrors`, `dbo.ContextSnapshotSourceHashes`, `dbo.GraphSnapshots`, `dbo.GraphSnapshotEdges`, `dbo.GraphSnapshotNodes`, `dbo.GraphSnapshotNodeProperties`, `dbo.GraphSnapshotEdgeProperties`, `dbo.GraphSnapshotWarnings`, `dbo.FindingRecords`, `dbo.FindingRelatedNodes`, `dbo.FindingRecommendedActions`, `dbo.FindingProperties`, `dbo.FindingTraceGraphNodesExamined`, `dbo.FindingTraceRulesApplied`, `dbo.FindingTraceDecisionsTaken`, `dbo.FindingTraceAlternativePaths`, `dbo.FindingTraceNotes`, `dbo.FindingReviewEvents`, `dbo.GoldenManifestWarnings`, `dbo.GoldenManifestDecisions`, `dbo.GoldenManifestDecisionEvidenceLinks`, `dbo.GoldenManifestDecisionNodeLinks`, `dbo.GoldenManifestProvenanceSourceFindings`, `dbo.GoldenManifestProvenanceSourceGraphNodes`, `dbo.GoldenManifestProvenanceAppliedRules`, `dbo.ArtifactBundleArtifacts`, `dbo.ArtifactBundleArtifactMetadata`, `dbo.ArtifactBundleArtifactDecisionLinks`, `dbo.ArtifactBundleTraceGenerators`, `dbo.ArtifactBundleTraceDecisionLinks`, `dbo.ArtifactBundleTraceNotes`, `dbo.ConversationMessages`, `dbo.CompositeAlertRuleConditions`, `dbo.PolicyPackVersions`, `dbo.ProductLearningImprovementPlanArchitectureRuns`, `dbo.ProductLearningImprovementPlanSignalLinks`, `dbo.ProductLearningImprovementPlanArtifactLinks`, `dbo.EvolutionSimulationRuns`, `dbo.ItsmFindingCorrelations`, `dbo.RunTelemetry` | Child, bridge, trace, or graph rows scoped through a covered parent lookup and repository join discipline. |
| `operational-table` | `dbo.BackgroundJobs`, `dbo.HostLeaderLeases`, `dbo.DataConsistencyQuarantine`, `dbo.FirstTenantFunnelEvents` | Operational scheduling, leader election, quarantine, or funnel telemetry where app/job identities and monitoring are the primary controls. |
| `explicit-accepted-residual-risk` | `dbo.ArchitectureRequests`, `dbo.EvidenceBundles`, `dbo.DecisionTraces`, `dbo.ImportedArchitectureRequests`, `dbo.UsageEvents` | Legacy or shared surfaces retained for compatibility or operational reporting; access must stay behind scoped application APIs and least-privilege SQL identities until future denormalization or retirement. |
