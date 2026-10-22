using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Advisory;

/// <summary>
///     Executes a scheduled advisory scan: compares runs, builds an improvement plan, merges effective policy defaults,
///     evaluates alerts, and delivers a digest.
/// </summary>
/// <param name = "authorityQueryService">Loads latest runs and golden manifests for the project slug.</param>
/// <param name = "improvementAdvisorService">Generates <see cref = "ImprovementPlan"/> from findings.</param>
/// <param name = "comparisonService">Optional run-to-run comparison when a previous run exists.</param>
/// <param name = "digestBuilder">Builds the architecture digest payload from plan + alerts.</param>
/// <param name = "digestRepository">Persists digest rows.</param>
/// <param name = "deliveryDispatcher">Sends digest to configured channels.</param>
/// <param name = "alertService">Simple alert evaluation for the scan context.</param>
/// <param name = "compositeAlertService">Composite alert evaluation for the same context.</param>
/// <param name = "effectiveGovernanceLoader">
///     Supplies merged policy content for advisory defaults and alert/compliance
///     filtering.
/// </param>
/// <param name = "recommendationRepository">Historical recommendations for the run.</param>
/// <param name = "recommendationLearningService">Learning profile for advisory context.</param>
/// <param name = "executionRepository">Tracks scan execution lifecycle.</param>
/// <param name = "scheduleRepository">Schedule metadata (advance after success/failure).</param>
/// <param name = "scheduleCalculator">Next-run scheduling.</param>
/// <param name = "auditService">Audit events for scan, digest, and related actions.</param>
/// <remarks>
///     Pushes <see cref = "AmbientScopeContext"/> for the schedule’s tenant/workspace/project so downstream providers
///     (compliance, governance) resolve the correct scope.
///     Loads <see cref = "IEffectiveGovernanceLoader.LoadEffectiveContentAsync"/> once per successful scan and passes it
///     into <see cref = "AlertEvaluationContextFactory.ForAdvisoryScan"/> so alert services avoid a second governance load.
/// </remarks>
/// <seealso cref = "IAdvisoryScanRunner"/>
public sealed partial class AdvisoryScanRunner(
    IAuthorityQueryService authorityQueryService,
    IImprovementAdvisorService improvementAdvisorService,
    IComparisonService comparisonService,
    IArchitectureDigestBuilder digestBuilder,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    IArchitectureDigestRepository digestRepository,
    IDigestDeliveryDispatcher deliveryDispatcher,
    IAlertService alertService,
    ICompositeAlertService compositeAlertService,
    IEffectiveGovernanceLoader effectiveGovernanceLoader,
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningService recommendationLearningService,
    IAdvisoryScanExecutionRepository executionRepository,
    IAdvisoryScanScheduleRepository scheduleRepository,
    IScanScheduleCalculator scheduleCalculator,
    IAuditService auditService,
    IIntegrationEventPublisher integrationEventPublisher,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IManifestHashService manifestHashService,
    ILogger<AdvisoryScanRunner> logger) : IAdvisoryScanRunner
{
    private const string StatusStarted = "Started";
    private const string StatusCompleted = "Completed";
    private const string StatusFailed = "Failed";
}
