> **Scope:** Contributor-reference — internal bug-hunt evidence log; not buyer-facing.

# `/al-bug` evidence-guided reseed report

Generated UTC: `2026-08-24T21:13:19.013564+00:00`

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

Total requiring reseed: **65**.

## Coverage-guided branch hotspots

| Path | Line coverage | Branch coverage |
| --- | --- | --- |
| `ArchLucid.Cli/CliExecutionContext.cs` | 12.5% | 0.0% |
| `ArchLucid.Contracts/Drafts/ArchitectureDraftStructuredBrief.cs` | 16.7% | 0.0% |
| `ArchLucid.Contracts/Architecture/TransparencyTrail.cs` | 54.5% | 0.0% |
| `ArchLucid.Cli/Commands/DraftNewCommandHooks.cs` | 57.7% | 0.0% |
| `ArchLucid.Cli/ArchLucidProjectScaffolder.cs` | 0.0% | 6.1% |
| `ArchLucid.Cli/Commands/CliCommandShared.cs` | 13.6% | 6.2% |
| `ArchLucid.Cli/Commands/DraftNewCommandOptions.cs` | 47.2% | 31.8% |
| `ArchLucid.Cli/Commands/DraftNewCommand.cs` | 20.4% | 35.0% |
| `ArchLucid.Cli/CliOperatorHints.cs` | 43.8% | 37.5% |
| `ArchLucid.Cli/CliScopeHeaders.cs` | 33.3% | 40.0% |
| `ArchLucid.Cli/CliScopeResponseValidator.cs` | 88.6% | 83.3% |
| `ArchLucid.Api.Client/ProblemDetails.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Admin/AdminDeploymentStatusQuery.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Admin/InvitationTokenGenerator.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Admin/ModelEngineSelectionOptionsBuilder.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Admin/UserInvitationAdminService.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Advisory/AdvisoryScanRunner.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Advisory/RecommendationLearningBuildGate.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Advisory/RecommendationLearningOperationalService.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Advisory/RecommendationLearningService.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Advisory/WeeklyDigestHealthSnapshot.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/AgentConfidenceCalibrator.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostSummary.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/AgentModelCatalogEvaluationRecorder.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/AgentArchitectureFindingEmissionEnricher.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/CrossAgentProposalConsistencyEnricher.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/EvidenceProposalPromoter.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/NoOpAgentResultPostExecutionEnricher.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/ProposedEvidencePayload.cs` | 0.0% | 100.0% |
| `ArchLucid.Application/Agents/Evidence/TopologyProposalDualModelConsensusEnricher.cs` | 0.0% | 100.0% |

## Surviving mutants

| Path | Line | Mutator | Replacement |
| --- | --- | --- | --- |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 17 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 32 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 33 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 34 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 35 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 38 | Conditional (false) mutation | `(false?options.ApiBaseUrl.TrimEnd('/')
:ArchLucidApiClient.ResolveBaseUrl(config))` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 38 | Conditional (true) mutation | `(true?options.ApiBaseUrl.TrimEnd('/')
:ArchLucidApiClient.ResolveBaseUrl(config))` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 52 | Equality mutation | `intent.Length <= DraftIntakeValidation.MinimumFreeTextIntentLength` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 85 | Logical mutation | `!created.Success && created.Value is null` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 102 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 102 | String mutation | `$""` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 145 | Logical mutation | `!patched.Success && patched.Value is null` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 156 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 164 | Logical mutation | `!admission.Success && admission.Value is null` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 184 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 189 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 189 | String mutation | `""` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 206 | Logical mutation | `!submit.Success && submit.Value is null` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 221 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 244 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 244 | String mutation | `$""` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 251 | Logical mutation | `executed is null && !executed.Success` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 261 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 261 | String mutation | `$""` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 263 | Statement mutation | `;` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 263 | String mutation | `$""` |
| `/workspace/ArchLucid.Cli/Commands/DraftNewCommand.cs` | 285 | Logical mutation | `!questionsResult.Success && questionsResult.Value is null` |

Total surviving mutants: **27**.

## Production churn without a matching test filename (1 days)

- `ArchLucid.AgentRuntime/CostAgentHandler.cs`
- `ArchLucid.AgentRuntime/CriticAgentHandler.cs`
- `ArchLucid.AgentRuntime/DevSwitchableAgentExecutor.cs`
- `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`
- `ArchLucid.AgentRuntime/TopologyAgentHandler.cs`
- `ArchLucid.Analyzers/Al0003MutatingControllerAuditDescriptor.cs`
- `ArchLucid.Analyzers/TenantScopedSqlExpressionResolver.cs`
- `ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs`
- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs`
- `ArchLucid.Api/Controllers/Authority/RunDetailPageBundleController.cs`
- `ArchLucid.Api/Controllers/Authority/RunsController.AsyncOperations.cs`
- `ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs`
- `ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs`
- `ArchLucid.Api/Controllers/Demo/DemoViewerController.cs`
- `ArchLucid.Api/Controllers/Diagnostics/DevelopmentCatalogResetController.cs`
- `ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs`
- `ArchLucid.Api/Controllers/Scim/ScimUsersController.cs`
- `ArchLucid.Api/Models/Diagnostics/DevelopmentCatalogResetResponse.cs`
- `ArchLucid.Api/Security/RouteTenantScopeBindingFilter.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderUriValidator.cs`
- `ArchLucid.Api/Startup/SwaggerExtensions.cs`
- `ArchLucid.Application/Analysis/CompareQualityDeltaExportFormatter.cs`
- `ArchLucid.Application/Analysis/EndToEndReplayComparisonExportService.cs`
- `ArchLucid.Application/Analysis/MarkdownEndToEndReplayComparisonSummaryFormatter.cs`
- `ArchLucid.Application/Budgeting/ILlmWalletSettlementQueue.cs`
- `ArchLucid.Application/Diagnostics/IDevelopmentCatalogResetService.cs`
- `ArchLucid.Application/Drafts/DraftRequestProjector.cs`
- `ArchLucid.Application/Drafts/DraftRequestStateMachine.cs`
- `ArchLucid.Application/Drafts/DraftSpawnedArchitectureRequestId.cs`
- `ArchLucid.Application/Drafts/DraftSubmitIdempotency.cs`
- `ArchLucid.Application/Drafts/DraftSubmitResponseFactory.cs`
- `ArchLucid.Application/Drafts/DraftSubmitSplitState.cs`
- `ArchLucid.Application/Evidence/NoOpAgentEvidenceUntrustedInputSanitizer.cs`
- `ArchLucid.Application/Governance/ExecuteTimeGovernanceScopeCaptureService.cs`
- `ArchLucid.Application/Governance/IArchitectureReviewRecurrenceNextRunCalculator.cs`
- `ArchLucid.Application/Governance/Posture/IArchitecturePostureService.cs`
- `ArchLucid.Application/Governance/Posture/IExaminationStateResolver.cs`
- `ArchLucid.Application/Integrations/Itsm/OAuth/ItsmAtlassianOAuthPkce.cs`
- `ArchLucid.Application/Notifications/Email/ExecDigestEmailDispatcher.cs`
- `ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs`
- `ArchLucid.Application/Notifications/Email/WeeklySponsorSummaryEmailDispatcher.cs`
- `ArchLucid.Application/Operations/RunOperationProjector.cs`
- `ArchLucid.Application/Pilots/PilotBuyerSafeEvidenceGateEvaluator.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncCreateAdmitResult.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncCreateAdmitter.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationHostedService.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationKind.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationWorkItem.cs`
- `ArchLucid.Application/Runs/Async/IArchitectureRunAsyncCreateAdmitter.cs`
- `ArchLucid.Application/Runs/Coordination/ArchitectureRunAuthorityCoordination.cs`

Total: **254**.

## Changed production files outside the zone catalog

- `ArchLucid.AgentRuntime/AzureOpenAiOptionsValidator.cs`
- `ArchLucid.AgentRuntime/CostAgentHandler.cs`
- `ArchLucid.AgentRuntime/CriticAgentHandler.cs`
- `ArchLucid.AgentRuntime/DevSwitchableAgentExecutor.cs`
- `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`
- `ArchLucid.AgentRuntime/TopologyAgentHandler.cs`
- `ArchLucid.Analyzers/Al0003MutatingControllerAuditDescriptor.cs`
- `ArchLucid.Analyzers/TenantScopedQuerySqlInspector.cs`
- `ArchLucid.Analyzers/TenantScopedSqlExpressionResolver.cs`
- `ArchLucid.Analyzers/TenantScopedTableRegistry.cs`
- `ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs`
- `ArchLucid.Api/Controllers/Demo/DemoViewerController.cs`
- `ArchLucid.Api/Controllers/Diagnostics/DevelopmentCatalogResetController.cs`
- `ArchLucid.Api/Controllers/Integrations/WebhookSimulationController.cs`
- `ArchLucid.Api/Controllers/User/UserPreferencesController.cs`
- `ArchLucid.Api/Models/Diagnostics/DevelopmentCatalogResetResponse.cs`
- `ArchLucid.Api/Security/ScopeResolutionGuard.cs`
- `ArchLucid.Api/Services/Admin/AdminDiagnosticsService.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderDiscoveryService.cs`
- `ArchLucid.Api/Services/Admin/IdentityProviderUriValidator.cs`
- `ArchLucid.Api/Startup/SwaggerExtensions.cs`
- `ArchLucid.Application/ArchitectureIntelligence/ArchitectureIntelligenceProductBridge.cs`
- `ArchLucid.Application/Budgeting/ILlmWalletSettlementQueue.cs`
- `ArchLucid.Application/Diagnostics/IDevelopmentCatalogResetService.cs`
- `ArchLucid.Application/Drafts/DraftAdmissionService.cs`
- `ArchLucid.Application/Drafts/DraftRequestProjector.cs`
- `ArchLucid.Application/Drafts/DraftRequestStateMachine.cs`
- `ArchLucid.Application/Drafts/DraftSpawnedArchitectureRequestId.cs`
- `ArchLucid.Application/Drafts/DraftSubmitIdempotency.cs`
- `ArchLucid.Application/Drafts/DraftSubmitResponseFactory.cs`
- `ArchLucid.Application/Drafts/DraftSubmitSplitState.cs`
- `ArchLucid.Application/Evidence/NoOpAgentEvidenceUntrustedInputSanitizer.cs`
- `ArchLucid.Application/Operations/RunOperationProjector.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncCreateAdmitResult.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncCreateAdmitter.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationAcceptor.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationHostedService.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationKind.cs`
- `ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationWorkItem.cs`
- `ArchLucid.Application/Runs/Async/IArchitectureRunAsyncCreateAdmitter.cs`
- `ArchLucid.Application/Runs/Coordination/ArchitectureRunAuthorityCoordination.cs`
- `ArchLucid.Application/Runs/Coordination/IArchitectureRunAuthorityCoordination.cs`
- `ArchLucid.Application/Runs/Orchestration/ArchitectureRunCreateOrchestrator.cs`
- `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.AgentLoop.cs`
- `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.Persistence.cs`
- `ArchLucid.Application/Runs/Orchestration/AuthorityPipelineWorkPayloadJson.cs`
- `ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs`
- `ArchLucid.Application/Runs/Orchestration/IArchitectureRunCreateOrchestrator.cs`
- `ArchLucid.Application/Runs/QuickStartReviewTitleCompleteness.cs`
- `ArchLucid.Application/Scim/ScimUserResourceParser.cs`

Total: **227**.

## Required mechanism rotation

For each selected zone, generate hypotheses from at least three different rows before declaring seed-only:

1. Sibling-path check asymmetry.
2. Serialization/null/empty/enum/culture/UTC boundary.
3. Cancellation/retry/idempotency/concurrency behavior.
4. Coverage branch with no assertion.
5. Surviving mutant.
6. Recent production churn without matching test churn.
