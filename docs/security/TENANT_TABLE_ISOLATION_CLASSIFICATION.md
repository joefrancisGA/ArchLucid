> **Scope:** Tenant table isolation registry — maps every `dbo.*` table to its isolation approach per ADR 0037.
>
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Tenant table isolation classification

## 1. Objective

Give operators and security reviewers a **single table-style view** of every `dbo.*` table classified by its isolation approach. Production tenant isolation relies on **database-per-tenant catalogs** (`SystemWithPerTenantCatalogs`) and **application-layer scope predicates** per ADR 0037. SQL Row-Level Security is not used.

## 2. Assumptions

- Application-layer scope enforcement (`IScopeContextProvider`, governance APIs) remains authoritative for business authorization.
- In `SystemWithPerTenantCatalogs` (production) mode, the database boundary provides sufficient tenant isolation. Application-layer scope predicates (Layer D) add defense-in-depth and this registry describes the classification of each table. In `SingleCatalog` (dev/test) mode, the compensating controls below remain relevant.
- Operational jobs that need cross-tenant access use dedicated identities; those paths are gated and audited separately.

## 3. Constraints

- Child tables keyed only by technical identifiers (`RunId`, `SnapshotId`, …) do not carry scope-triple columns but are accessed only through scoped parent lookups and repository join discipline.
- The registry is **not** a SOC attestation; it informs backlog prioritization and risk acceptance packets.

## 4. Architecture overview

**Nodes:** SQL tables partitioned into **scope-triple-on-row**, **tenant-id-on-row**, **system-plane-only**, **child-via-parent**, **operational**, and **accepted-residual**.

**Edges:** API requests → repositories → parameterized SQL → row visibility.

**Isolation model:** Database-per-tenant catalogs provide the primary boundary; application-layer scope predicates enforce workspace/project isolation within a tenant catalog per ADR 0037 Layer D.

## 5. Component breakdown

| Bucket | Examples (non-exhaustive) | Enforcement expectation |
|--------|---------------------------|-------------------------|
| scope-triple-on-row | `dbo.Runs`, `dbo.ContextSnapshots`, `dbo.FindingsSnapshots`, `dbo.GoldenManifests`, `dbo.AuditEvents`, digest + alert core tables | Scope-triple columns present on row; app-layer repository predicates enforce isolation per ADR 0037 Layer D |
| tenant-id-on-row | `dbo.SentEmails`, trial/onboarding tables per migrations **096** / **097** | Tenant-id column present on row; tenant-scoped repository methods enforce isolation |
| system-plane-only | `dbo.Tenants`, `dbo.TenantWorkspaces`, `dbo.Projects`, identity, billing | Database boundary + least-privilege SQL identities; no per-row tenant column needed |
| child-via-parent | `dbo.AgentTasks`, graph snapshots, finding records, bundle bridges | Application joins + explicit `TenantId` filters in repositories |

## 6. Data flow

1. Happy path: Request resolves tenant/workspace/project → repositories include scope predicates → SQL returns only in-scope rows.
2. Residual path: Query touches child-via-parent table → correctness depends on **join keys anchored to a scoped parent** (for example, manifest or run rows that are themselves scoped) and **code review** preventing orphan reads.
3. Jobs / migrations: Cross-tenant jobs use dedicated identities; operators follow runbooks to avoid accidental cross-tenant reads.

## 7. Security model

**Strengths:** Covered tables (scope-triple-on-row, tenant-id-on-row) gain automatic filtering via repository predicates enforced at compile time. Database-per-tenant catalogs prevent cross-tenant data leakage at the storage boundary.

**Weaknesses:** child-via-parent tables remain vulnerable to **missing WHERE clauses** or **ID-guessing** if an attacker obtains raw identifiers without passing scoped parent lookups.

**Mitigations (design intent):**

- Repository APIs accept scope explicitly; integration tests cover cross-tenant negatives where SQL fixtures exist, plus pool-recycling isolation tests.
- Operational telemetry flags orphan anomalies (`DataConsistencyOrphanProbeExecutor`) for GoldenManifests / FindingsSnapshots / ContextSnapshots / GraphSnapshots.

**Trade-off:** Full scope-triple denorm on every child table increases migration churn; staged denormalization (pattern established in DbUp **046**) is the scalable bridge.

## 8. Operational considerations

| Residual surface | Primary compensating control | Monitoring / evidence |
|------------------|------------------------------|------------------------|
| Legacy architecture strings (`ArchitectureRequests`, `ArchitectureRuns`, …) | API-only access; no ad-hoc reporting accounts | API audit + scoped integration tests |
| Graph snapshots without triple | Join via scoped parents only | Orphan probe counts + optional auto-remediation for graph snapshots |
| Finding rows keyed by snapshot | Scoped via parent findings snapshot | Same orphan probes for findings snapshots |
| Background operational tables (`BackgroundJobs`, leases) | Dedicated job identities + manual review | Host metrics / job dashboards |

**Cost:** Engineering time to extend denormalized scope vs. sustained reliance on repository discipline.

**Scalability:** App-layer predicate simplicity on covered tables preserves plan stability; expanding coverage follows the **046** pattern (add columns + backfill).

**Reliability:** Pool recycling is handled by catalog-scoped connection factories; no session context refresh required.

**Terraform / IaC:** Table DDL ships via DbUp and mirrors in `ArchLucid.sql`; no RLS STATE toggles exist.

## 9. Executable table isolation classifications

`scripts/ci/assert_tenant_table_isolation_classifications.py` treats this table as the executable allowlist. **`scripts/ci/data/tenant_scoped_tables.v1.json`** (generated by `scripts/ci/generate_tenant_scoped_tables_json.py`) feeds the **ARCH006** persistence analyzer with the **`scope-triple-on-row`** and **`tenant-id-on-row`** buckets only. Any current `CREATE TABLE dbo.*` in `ArchLucid.Persistence/Scripts/ArchLucid.sql`, or newly changed forward migration table in CI, must appear in exactly one row below.

| Classification | Tables | Classification basis |
|----------------|--------|----------------------|
| `scope-triple-on-row` | `dbo.Runs`, `dbo.Reviews`, `dbo.ContextSnapshots`, `dbo.FindingsSnapshots`, `dbo.DecisioningTraces`, `dbo.GoldenManifests`, `dbo.SignedReviewRecords`, `dbo.GoldenManifestAssumptions`, `dbo.ArtifactBundles`, `dbo.AuditEvents`, `dbo.ProvenanceSnapshots`, `dbo.ConversationThreads`, `dbo.RecommendationRecords`, `dbo.RecommendationLearningProfiles`, `dbo.AdvisoryScanSchedules`, `dbo.AdvisoryScanExecutions`, `dbo.ArchitectureReviewRecurrenceSchedules`, `dbo.ArchitectureDigests`, `dbo.DigestSubscriptions`, `dbo.DigestDeliveryAttempts`, `dbo.AlertRules`, `dbo.AlertRecords`, `dbo.AlertRoutingSubscriptions`, `dbo.AlertDeliveryAttempts`, `dbo.CompositeAlertRules`, `dbo.PolicyPacks`, `dbo.PolicyPackAssignments`, `dbo.ProjectRoleAssignments`, `dbo.PolicyPackChangeLog`, `dbo.RetrievalIndexingOutbox`, `dbo.CosmosGraphSnapshotOutbox`, `dbo.RunExportBlobPushOutbox`, `dbo.RiskExceptions`, `dbo.IntegrationEventOutbox`, `dbo.AuthorityPipelineWorkOutbox`, `dbo.ArchitectureRunIdempotency`, `dbo.CommitRunIdempotency`, `dbo.FinalizeReviewIdempotency`, `dbo.ProductLearningPilotSignals`, `dbo.ProductLearningImprovementThemes`, `dbo.ProductLearningImprovementPlans`, `dbo.EvolutionCandidateChangeSets`, `dbo.BillingSubscriptionStateHistory`, `dbo.TenantHealthScores`, `dbo.ProductFeedback`, `dbo.FindingFeedback`, `dbo.FineTuningTrainingExportAudits`, `dbo.CorePilotTeamChecklist`, `dbo.PilotCloseouts`, `dbo.PostCommitProjectionOutbox`, `dbo.DraftRequests`, `dbo.GovernancePromotionRecords`, `dbo.GovernanceEnvironmentActivations`, `dbo.SupportProblemReports` | Scope-triple columns present on row; app-layer repository predicates enforce isolation per ADR 0037 Layer D. `dbo.CosmosGraphSnapshotOutbox` carries tenant/workspace/project on enqueue (ADR graph-snapshot Cosmos projection worker). `dbo.PostCommitProjectionOutbox` is a post-commit scoped projection outbox. `dbo.SupportProblemReports` stores operator support intake with tenant/workspace/project scope columns. |
| `tenant-id-on-row` | `dbo.TenantCatalogMigrations`, `dbo.IdempotencyRecords`, `dbo.LlmDailyTenantTokenWindowState`, `dbo.LlmJudgeDailyTenantTokenWindowState`, `dbo.LlmMonthlyTenantBudgetState`, `dbo.LlmMonthlyTenantBudgetReservations`, `dbo.LlmTenantWalletState`, `dbo.LlmTenantWalletLedger`, `dbo.TenantAiBudgetPolicy`, `dbo.AiUsageEvents`, `dbo.SentEmails`, `dbo.TenantLifecycleTransitions`, `dbo.TenantTrialSeatOccupants`, `dbo.TenantOnboardingState`, `dbo.TenantSettings`, `dbo.TenantCostSettings`, `dbo.TenantAwsConnectionRecords`, `dbo.TenantGcpConnectionRecords`, `dbo.TenantItsmConnectorConnections`, `dbo.TenantAzureBoardsOutboundSettings`, `dbo.FineTunedModelRegistryEntries`, `dbo.UserInvitations`, `dbo.TenantSignInEmailDomains`, `dbo.TenantSignInEmailDomainRecoveryAdmins`, `dbo.PlatformTenantAuthRecoveryGrants`, `dbo.ArchitectureIntelligenceSources`, `dbo.ArchitectureKnowledgeModels` | Tenant-id column present on row; no workspace/project columns are present on these rows (includes HTTP `Idempotency-Key` replay cache keyed by tenant, LLM execution and judge UTC-day token pools, wallet state/ledger rows filtered by tenant repository methods, per-tenant AI budget policy overrides (`dbo.TenantAiBudgetPolicy`; tenant-id PK), append-only AI usage telemetry (`dbo.AiUsageEvents`; `TenantId` + `IX_AiUsageEvents_TenantOccurred`), schema-reserved fine-tuned model registry rows (`dbo.FineTunedModelRegistryEntries`; V1 DI uses `InMemoryFineTunedModelRegistry` only — no SQL writer yet), hosted cloud/ITSM connector configuration keyed by tenant, Azure Boards outbound defaults (`dbo.TenantAzureBoardsOutboundSettings`; tenant-id PK), tenant-scoped user invitations (`dbo.UserInvitations`), SSO sign-in email domain policy (`dbo.TenantSignInEmailDomains`), recovery-admin allowlist (`dbo.TenantSignInEmailDomainRecoveryAdmins`), platform recovery grants (`dbo.PlatformTenantAuthRecoveryGrants`), and closed-loop architecture intelligence immutable source artifacts plus knowledge models (`dbo.ArchitectureIntelligenceSources`, `dbo.ArchitectureKnowledgeModels`; TB-1976/TB-1977; `TenantId` + tenant-scoped indexes; repository predicates in `DapperArchitectureIntelligencePersistence`). |
| `system-plane-only` | `dbo.Tenants`, `dbo.TenantWorkspaces`, `dbo.Projects`, `dbo.IdentityUsers`, `dbo.BillingSubscriptions`, `dbo.BillingWebhookEvents`, `dbo.HostLlmCostEstimationUsdRates`, `dbo.TenantNotificationChannelPreferences`, `dbo.TenantExecDigestPreferences`, `dbo.TenantTeamsIncomingWebhookConnections`, `dbo.TenantItsmOutboundSettings`, `dbo.TenantIdentityProviderConfigurations`, `dbo.TenantHostedExtractorConfigurations`, `dbo.ScimTenantTokens`, `dbo.ScimUsers`, `dbo.ScimGroups`, `dbo.ScimGroupMembers`, `dbo.AdminNotifications`, `dbo.MarketingPricingQuoteRequests`, `dbo.MarketingEarlyAccessRequests`, `dbo.PlatformSelfServiceTrialEmailClaims`, `dbo.PlatformSelfServiceTrialDomainClaims`, `dbo.AzureExtractorPackages`, `dbo.CloudInventoryExtractorPackages`, `dbo.PlatformAuditEvents`, `dbo.PolicyPackCatalogEntry`, `dbo.PlatformUsers`, `dbo.AuthenticationIdentities`, `dbo.AuthenticationIdentityLinkProposals`, `dbo.IdentityMigrationReviewItems`, `dbo.WorkspaceMemberships` | Tenant registry, workspace-scoped architecture project rows (`dbo.Projects`), identity, billing, append-only durable platform audit (operator actions; outside tenant-session scope), host-level LLM cost-estimation USD/M overrides (singleton), integration configuration, per-tenant SSO/OIDC/SAML identity provider configuration (`dbo.TenantIdentityProviderConfigurations`; tenant-id PK; API enforces caller tenant), SCIM, admin notification, quote intake, early-access capture, self-service trial abuse tracking (`dbo.PlatformSelfServiceTrialEmailClaims`, `dbo.PlatformSelfServiceTrialDomainClaims`; platform-plane lifetime email cap and domain velocity), extractor package control-plane data, **global promoted policy-pack catalog** rows (`dbo.PolicyPackCatalogEntry`; operator promote/demote; no tenant/workspace/project columns; catalog list/detail is intentionally cross-tenant for promoted entries), platform identity (`dbo.PlatformUsers`, `dbo.AuthenticationIdentities`, `dbo.AuthenticationIdentityLinkProposals`), identity-migration review queue (`dbo.IdentityMigrationReviewItems`; nullable `TenantId` for operator triage), and workspace membership registry (`dbo.WorkspaceMemberships`; platform user to tenant/workspace role bindings); production tenant isolation is the database boundary per ADR 0037. |
| `child-via-parent` | `dbo.AgentTasks`, `dbo.AgentResults`, `dbo.AgentResultEnrichments`, `dbo.AgentEvidencePackages`, `dbo.AgentExecutionTraces`, `dbo.AgentToolInvocationRecords`, `dbo.AgentOutputEvaluationResults`, `dbo.AgentOutputCalibrationSamples`, `dbo.TenantCuratedEvidenceEntries`, `dbo.RunExportRecords`, `dbo.ComparisonRecords`, `dbo.DecisionNodes`, `dbo.AgentEvaluations`, `dbo.ContextSnapshotCanonicalObjects`, `dbo.ContextSnapshotCanonicalObjectProperties`, `dbo.ContextSnapshotWarnings`, `dbo.ContextSnapshotErrors`, `dbo.ContextSnapshotSourceHashes`, `dbo.GraphSnapshots`, `dbo.GraphSnapshotEdges`, `dbo.GraphSnapshotNodes`, `dbo.GraphSnapshotNodeProperties`, `dbo.GraphSnapshotEdgeProperties`, `dbo.GraphSnapshotWarnings`, `dbo.FindingRecords`, `dbo.FindingRelatedNodes`, `dbo.FindingRecommendedActions`, `dbo.FindingProperties`, `dbo.FindingTraceGraphNodesExamined`, `dbo.FindingTraceRulesApplied`, `dbo.FindingTraceDecisionsTaken`, `dbo.FindingTraceAlternativePaths`, `dbo.FindingTraceNotes`, `dbo.FindingReviewEvents`, `dbo.GoldenManifestWarnings`, `dbo.GoldenManifestDecisions`, `dbo.GoldenManifestDecisionEvidenceLinks`, `dbo.GoldenManifestDecisionNodeLinks`, `dbo.GoldenManifestProvenanceSourceFindings`, `dbo.GoldenManifestProvenanceSourceGraphNodes`, `dbo.GoldenManifestProvenanceAppliedRules`, `dbo.ArtifactBundleArtifacts`, `dbo.ArtifactBundleArtifactMetadata`, `dbo.ArtifactBundleArtifactDecisionLinks`, `dbo.ArtifactBundleTraceGenerators`, `dbo.ArtifactBundleTraceDecisionLinks`, `dbo.ArtifactBundleTraceNotes`, `dbo.ConversationMessages`, `dbo.CompositeAlertRuleConditions`, `dbo.PolicyPackVersions`, `dbo.ProductLearningImprovementPlanArchitectureRuns`, `dbo.ProductLearningImprovementPlanSignalLinks`, `dbo.ProductLearningImprovementPlanArtifactLinks`, `dbo.EvolutionSimulationRuns`, `dbo.ItsmFindingCorrelations`, `dbo.RetrievalGroundingTrace`, `dbo.RunTelemetry`, `dbo.RunStageOutcomes`, `dbo.TechnologyLedgerEntries`, `dbo.GovernanceApprovalRequests` | Child, bridge, trace, forensic, or graph rows scoped through a covered parent lookup and repository join discipline; `dbo.AgentResultEnrichments` is a post-commit overlay keyed by `ResultId` (TB-303 / ADR 0039) with sealed `dbo.AgentResults` as parent; retrieval grounding trace reads also require tenant/workspace/project/run predicates and are covered by orphan detection; `dbo.TechnologyLedgerEntries` is keyed by `RunId` and accessed only through scoped run/technology-ledger repositories; `dbo.GovernanceApprovalRequests` is keyed by `RunId` and accessed only through scoped run/governance repositories. |
| `operational` | `dbo.BackgroundJobs`, `dbo.HostLeaderLeases`, `dbo.DataConsistencyQuarantine`, `dbo.FirstTenantFunnelEvents`, `dbo.AuthorityPipelineTenantExecutionLease`, `dbo.StripeWebhookIdempotency`, `dbo.BackfillCheckpoints`, `dbo.BackfillFailures`, `dbo.EmailOtpChallenges` | Operational scheduling, leader election, concurrency leases, quarantine, webhook replay protection, funnel telemetry, idempotent backfill checkpoint/failure quarantine rows, or short-lived email OTP challenge state where job identities and monitoring are the primary controls. |
| `accepted-residual` | `dbo.ArchitectureRequests`, `dbo.EvidenceBundles`, `dbo.ImportedArchitectureRequests`, `dbo.UsageEvents`, `dbo.UserSettings` | Legacy or shared surfaces retained for compatibility or operational reporting; access must stay behind scoped application APIs and least-privilege SQL identities until future denormalization or retirement. `dbo.UserSettings` stores per-user key/value preferences (`UserId` PK; no `TenantId`); tenant isolation relies on database-per-tenant catalogs plus `IUserSettingsRepository` reads/writes filtered to `IActorContext.GetActorId()`. Coordinator `dbo.DecisionTraces` and unwired Confluence publish tables were dropped in migration **296**. |
