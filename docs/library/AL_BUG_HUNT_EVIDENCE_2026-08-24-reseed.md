# `/al-bug` evidence-guided reseed report

Generated UTC: `2026-08-24T23:41:47.588730+00:00`

This report ranks evidence sources; each row is a hypothesis input, not proof of a defect.

## Empty-hypothesis zones requiring source reseed

| Zone | Status | Paths |
| --- | --- | --- |
| topology-proposal-merge | open | `ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs`<br>`ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalGraphMerge.cs` |
| arm-terraform-source-ids | open | `ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEdgeMapper.cs`<br>`ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs` |
| tenant-settings-sql | open | `ArchLucid.Persistence/Tenancy/SqlTenantSettingsRepository.cs`<br>`ArchLucid.Persistence/Tenancy/CachingTenantSettingsRepository.cs` |
| ui-form-validation | open | `archlucid-ui/src/components/marketing/SignupForm.tsx` |
| commit-output-integrity | open | `ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs`<br>`ArchLucid.Application/Runs/Orchestration/RealCommitAgentOutputQualityGateEvaluator.cs`<br>`ArchLucid.Core/AgentEvaluation/AgentExecutionTraceLatestPerTaskSelector.cs` |
| storage-vs-data-category | open | `ArchLucid.Application/Runs/Orchestration/AgentProposalStructuralPostProcessor.cs`<br>`ArchLucid.Application/Runs/Orchestration/CrossAgentProposalConsistencyGate.cs` |
| authority-pipeline-payload | open | `ArchLucid.Application/Runs/Orchestration/AuthorityPipelineWorkPayload.cs` |
| technology-ledger-merge | open | `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerAgentProposalMergePolicy.cs` |
| orchestrator-transient-retry | open | `ArchLucid.Application/Runs/Orchestration/OrchestratorTransientDbRetry.cs`<br>`ArchLucid.Application/Runs/Orchestration/CommitRunTransientRetryPolicy.cs` |
| email-otp-auth | open | `ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs`<br>`ArchLucid.Application/Identity/EmailOtpAuthService.cs` |
| auth-return-path | open | `ArchLucid.Application/Identity/AuthSignInReturnPathGuard.cs` |
| tenant-erasure | open | `ArchLucid.Application/Tenancy/TenantErasureCommandService.cs`<br>`ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs` |
| tenant-scoped-analyzer | open | `ArchLucid.Analyzers/TenantScopedQueryScopeBindingAnalyzer.cs` |
| sql-run-repository | open | `ArchLucid.Persistence/Repositories/SqlRunRepository.cs` |
| finding-inspect-sql | open | `ArchLucid.Persistence/Findings/DapperFindingInspectReadRepository.cs`<br>`ArchLucid.Persistence/Findings/FindingInspectReadModelMapper.cs`<br>`ArchLucid.Persistence/Sql/FindingInspectReadSql.cs` |
| llm-wallet | open | `ArchLucid.Api/Controllers/Billing/WalletController.cs`<br>`ArchLucid.Application/Budgeting/LlmTenantWalletService.cs`<br>`ArchLucid.Persistence/Data/Repositories/SqlLlmTenantWalletRepository.cs` |
| finding-disposition | open | `ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs`<br>`ArchLucid.Application/Governance/FindingDisposition/FindingDispositionValidation.cs` |
| review-recurrence | open | `ArchLucid.Application/Governance/ArchitectureReviewRecurrenceNextRunCalculator.cs` |
| alert-simulation | open | `ArchLucid.Api/Controllers/Alerts/AlertSimulationController.cs`<br>`ArchLucid.Persistence/Alerts/Simulation/AlertSimulationContextProvider.cs` |
| weekly-digest-email | open | `ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs` |
| outbound-webhook-dry-run | open | `ArchLucid.Api/Controllers/Webhooks/OutboundWebhookDryRunController.cs`<br>`ArchLucid.Host.Composition/Services/OutboundWebhookDryRunService.cs` |
| architecture-recommendation | open | `ArchLucid.Application/ArchitectureIntelligence/ArchitectureRecommendationEngine.cs` |
| extraction-router | open | `ArchLucid.Application/ArchitectureIntelligence/DifficultyBasedExtractionRouter.cs` |
| cli-tenant-isolation | open | `ArchLucid.Cli/Commands/TenantIsolationNegativeTestCommand.cs`<br>`ArchLucid.Cli/Commands/TenantIsolationNegativeTestRunner.cs` |
| cli-terraform-evidence | open | `ArchLucid.Cli/Commands/DeploymentEvidenceTerraformReference.cs` |
| ui-runs-list | open | `archlucid-ui/src/app/(operator)/architecture/reviews/RunsListClient.tsx` |
| ui-auth-callback | open | `archlucid-ui/src/app/(operator)/auth/callback/AuthCallbackAccessPanel.tsx` |
| ui-help-docs | open | `archlucid-ui/src/app/(operator)/help/HelpDocsClient.tsx` |
| ui-webhooks-settings | open | `archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx`<br>`archlucid-ui/src/app/(operator)/integrations/webhooks/use-webhooks-settings.ts` |
| ui-architecture-intelligence | open | `archlucid-ui/src/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageClient.tsx` |

Total requiring reseed: **67**.

## Coverage-guided branch hotspots

No coverage artifact was supplied.

## Surviving mutants

No surviving mutants were found in the supplied mutation report.

Total surviving mutants: **0**.

## Production churn without a matching test filename (7 days)

- `ArchLucid.AgentRuntime/AgentHandlerCompletionExecutor.cs`
- `ArchLucid.AgentRuntime/AgentPolicyPackRetrievalAppender.cs`
- `ArchLucid.AgentRuntime/CriticAgentHandler.cs`
- `ArchLucid.AgentRuntime/DevSwitchableAgentExecutor.cs`
- `ArchLucid.AgentRuntime/Evaluation/AgentEvaluationConfidencePipeline.cs`
- `ArchLucid.AgentRuntime/Evaluation/AgentEvaluationConfidenceRunContext.cs`
- `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`
- `ArchLucid.AgentRuntime/NullTopologyProposalSecondaryCompletionInvoker.cs`
- `ArchLucid.AgentRuntime/TopologyProposalSecondaryCompletionInvoker.cs`
- `ArchLucid.Analyzers/Al0003MutatingControllerAuditDescriptor.cs`
- `ArchLucid.Analyzers/TenantScopedSqlExpressionResolver.cs`
- `ArchLucid.Api/Configuration/ApiWebLayerServiceCollectionExtensions.cs`
- `ArchLucid.Api/Controllers/Admin/AdminAgentModelCatalogController.cs`
- `ArchLucid.Api/Controllers/Admin/RecordAgentModelCatalogEvaluationRequest.cs`
- `ArchLucid.Api/Controllers/Advisory/LearningController.cs`
- `ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs`
- `ArchLucid.Api/Controllers/ArchitectureIntelligence/ArchitectureIntelligenceController.cs`
- `ArchLucid.Api/Controllers/Authority/EvidenceDocumentTextExtractionController.cs`
- `ArchLucid.Api/Controllers/Authority/ReviewClarificationQuestionsController.cs`
- `ArchLucid.Api/Controllers/Authority/RunDetailPageBundleController.cs`
- `ArchLucid.Api/Controllers/Authority/RunsController.ArchitectureRequests.cs`
- `ArchLucid.Api/Controllers/Authority/RunsController.Archive.cs`
- `ArchLucid.Api/Controllers/Authority/RunsController.AsyncOperations.cs`
- `ArchLucid.Api/Controllers/Authority/RunsController.Intake.cs`
- `ArchLucid.Api/Controllers/Billing/BillingCheckoutController.cs`
- `ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs`
- `ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs`
- `ArchLucid.Api/Controllers/Demo/DemoViewerController.cs`
- `ArchLucid.Api/Controllers/Diagnostics/DevelopmentCatalogResetController.cs`
- `ArchLucid.Api/Controllers/Governance/GovernanceCoverageController.cs`
- `ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs`
- `ArchLucid.Api/Controllers/Integrations/TeamsIncomingWebhookConnectionsController.cs`
- `ArchLucid.Api/Controllers/Planning/AskController.cs`
- `ArchLucid.Api/Controllers/Scim/ScimUsersController.cs`
- `ArchLucid.Api/Filters/CommercialTenantTierFilter.cs`
- `ArchLucid.Api/Mapping/CoveragePreviewMapper.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewAssignmentResponse.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewRequest.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewResponse.cs`
- `ArchLucid.Api/Models/Diagnostics/DevelopmentCatalogResetResponse.cs`
- `ArchLucid.Api/Security/RouteTenantScopeBindingFilter.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationDefinition.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationDefinitions.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationOutcome.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationSqlHelpers.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderUriValidator.cs`
- `ArchLucid.Api/Services/IOutboundWebhookDryRunService.cs`
- `ArchLucid.Api/Services/LearningPlanningReadService.cs`
- `ArchLucid.Api/Services/OutboundWebhookDryRunResult.cs`
- `ArchLucid.Api/Startup/PipelineExtensions.cs`

Total: **2004**.

## Changed production files outside the zone catalog

- `ArchLucid.AgentRuntime/AgentHandlerCompletionExecutor.cs`
- `ArchLucid.AgentRuntime/AgentPolicyPackRetrievalAppender.cs`
- `ArchLucid.AgentRuntime/AzureOpenAiOptionsValidator.cs`
- `ArchLucid.AgentRuntime/ComplianceAgentHandler.cs`
- `ArchLucid.AgentRuntime/CostAgentHandler.cs`
- `ArchLucid.AgentRuntime/CriticAgentHandler.cs`
- `ArchLucid.AgentRuntime/DevSwitchableAgentExecutor.cs`
- `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`
- `ArchLucid.AgentRuntime/NullTopologyProposalSecondaryCompletionInvoker.cs`
- `ArchLucid.AgentRuntime/TopologyAgentHandler.cs`
- `ArchLucid.AgentRuntime/TopologyProposalSecondaryCompletionInvoker.cs`
- `ArchLucid.AgentSimulator/Services/DeterministicReviewEngine.cs`
- `ArchLucid.Analyzers/Al0003MutatingControllerAuditDescriptor.cs`
- `ArchLucid.Analyzers/TenantScopedQuerySqlInspector.cs`
- `ArchLucid.Analyzers/TenantScopedSqlExpressionResolver.cs`
- `ArchLucid.Analyzers/TenantScopedTableRegistry.cs`
- `ArchLucid.Api/Configuration/ApiWebLayerServiceCollectionExtensions.cs`
- `ArchLucid.Api/Controllers/Advisory/AdvisorySchedulingController.cs`
- `ArchLucid.Api/Controllers/Advisory/LearningController.cs`
- `ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs`
- `ArchLucid.Api/Controllers/Architecture/DraftRequestsController.cs`
- `ArchLucid.Api/Controllers/ArchitectureIntelligence/ArchitectureIntelligenceController.cs`
- `ArchLucid.Api/Controllers/Billing/BillingCheckoutController.cs`
- `ArchLucid.Api/Controllers/Demo/DemoViewerController.cs`
- `ArchLucid.Api/Controllers/Diagnostics/DevelopmentCatalogResetController.cs`
- `ArchLucid.Api/Controllers/Integrations/TeamsIncomingWebhookConnectionsController.cs`
- `ArchLucid.Api/Controllers/Integrations/WebhookSimulationController.cs`
- `ArchLucid.Api/Controllers/Planning/AskController.cs`
- `ArchLucid.Api/Controllers/User/UserPreferencesController.cs`
- `ArchLucid.Api/Filters/CommercialTenantTierFilter.cs`
- `ArchLucid.Api/Mapping/CoveragePreviewMapper.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewAssignmentResponse.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewRequest.cs`
- `ArchLucid.Api/Models/Coverage/CoveragePreviewResponse.cs`
- `ArchLucid.Api/Models/Diagnostics/DevelopmentCatalogResetResponse.cs`
- `ArchLucid.Api/Models/RunDetailsResponse.cs`
- `ArchLucid.Api/Security/ScopeResolutionGuard.cs`
- `ArchLucid.Api/Services/Admin/AdminDiagnosticsService.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationDefinition.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationDefinitions.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationExecutor.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationOutcome.cs`
- `ArchLucid.Api/Services/Admin/DataConsistencyRemediationSqlHelpers.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderDiscoveryService.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderUriValidator.cs`
- `ArchLucid.Api/Services/Billing/MarketplaceWebhookConnectivityService.cs`
- `ArchLucid.Api/Services/IOutboundWebhookDryRunService.cs`
- `ArchLucid.Api/Services/LearningPlanningReadService.cs`
- `ArchLucid.Api/Services/OutboundWebhookDryRunResult.cs`
- `ArchLucid.Api/Services/OutboundWebhookDryRunService.cs`

Total: **1841**.

## Required mechanism rotation

For each selected zone, generate hypotheses from at least three different rows before declaring seed-only:

1. Sibling-path check asymmetry.
2. Serialization/null/empty/enum/culture/UTC boundary.
3. Cancellation/retry/idempotency/concurrency behavior.
4. Coverage branch with no assertion.
5. Surviving mutant.
6. Recent production churn without matching test churn.
