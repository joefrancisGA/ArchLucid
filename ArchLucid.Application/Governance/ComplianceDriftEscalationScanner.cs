using System.Globalization;

using ArchLucid.Application.Integration;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-32 suggestion 378: scans scoped compliance drift metrics and publishes escalation integration events.</summary>
public sealed class ComplianceDriftEscalationScanner(
    ITenantRepository tenantRepository,
    IPolicyPackChangeLogRepository policyPackChangeLogRepository,
    IComplianceDriftFindingsTrendReader findingsTrendReader,
    IAuthorityQueryService authorityQueryService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IOptionsMonitor<ComplianceDriftEscalationOptions> escalationOptions,
    IManifestHashService manifestHashService,
    ILogger<ComplianceDriftEscalationScanner> logger)
{
    private const string DefaultAuthorityProjectSlug = "default";

    private static readonly TimeSpan OpenFindingsLookback = TimeSpan.FromHours(24);

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IComplianceDriftFindingsTrendReader _findingsTrendReader =
        findingsTrendReader ?? throw new ArgumentNullException(nameof(findingsTrendReader));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<ComplianceDriftEscalationOptions> _escalationOptions =
        escalationOptions ?? throw new ArgumentNullException(nameof(escalationOptions));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<ComplianceDriftEscalationScanner> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IPolicyPackChangeLogRepository _policyPackChangeLogRepository =
        policyPackChangeLogRepository ?? throw new ArgumentNullException(nameof(policyPackChangeLogRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task ScanDueAsync(DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        ComplianceDriftEscalationOptions options = _escalationOptions.CurrentValue;

        if (!options.Enabled)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Compliance drift escalation scan skipped because {Setting}=false.", nameof(options.Enabled));

            return;
        }

        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        string dayBucket = utcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        foreach (TenantRecord tenant in tenants)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                await TryScanTenantAsync(tenant, utcNow, dayBucket, options, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Compliance drift escalation scan failed for tenant {TenantId}.", tenant.Id);
            }
        }
    }

    private async Task TryScanTenantAsync(
        TenantRecord tenant,
        DateTimeOffset utcNow,
        string dayBucket,
        ComplianceDriftEscalationOptions options,
        CancellationToken cancellationToken)
    {
        TenantWorkspaceLink? workspaceLink =
            await _tenantRepository.GetFirstWorkspaceAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (workspaceLink is null)
            return;

        ScopeContext scope = new()
        {
            TenantId = tenant.Id,
            WorkspaceId = workspaceLink.WorkspaceId,
            ProjectId = workspaceLink.DefaultProjectId,
        };

        using (AmbientScopeContext.Push(scope))
        {
            Guid? runId = await ResolveOptionalLatestCommittedRunIdAsync(scope, cancellationToken).ConfigureAwait(false);

            if (options.OpenFindingsCountThreshold is int openThreshold)
            {
                double? observedOpenFindings = await TryMeasureOpenFindingsCountAsync(scope, utcNow, cancellationToken)
                    .ConfigureAwait(false);

                if (observedOpenFindings is >= 0 && observedOpenFindings >= openThreshold)
                {
                    await PublishEscalationAsync(
                        scope,
                        ComplianceDriftEscalationMetricKeys.OpenFindingsCount,
                        openThreshold,
                        observedOpenFindings,
                        runId,
                        dayBucket,
                        cancellationToken).ConfigureAwait(false);
                }
            }

            if (options.PolicyPackStaleHoursThreshold is double staleThreshold)
            {
                double? observedStaleHours = await TryMeasurePolicyPackStaleHoursAsync(scope, utcNow, cancellationToken)
                    .ConfigureAwait(false);

                if (observedStaleHours is >= 0 && observedStaleHours >= staleThreshold)
                {
                    await PublishEscalationAsync(
                        scope,
                        ComplianceDriftEscalationMetricKeys.PolicyPackStaleHours,
                        staleThreshold,
                        observedStaleHours,
                        runId,
                        dayBucket,
                        cancellationToken).ConfigureAwait(false);
                }
            }
        }
    }

    private async Task<Guid?> ResolveOptionalLatestCommittedRunIdAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid? runId = await _authorityQueryService
            .GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, DefaultAuthorityProjectSlug, cancellationToken)
            .ConfigureAwait(false);

        if (runId is null || runId == Guid.Empty)
            return null;

        string? manifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashOrNullAsync(
            runId.Value,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);

        if (manifestHash is null)
            return null;

        return runId;
    }

    private async Task<double?> TryMeasureOpenFindingsCountAsync(
        ScopeContext scope,
        DateTimeOffset utcNow,
        CancellationToken cancellationToken)
    {
        DateTime toUtc = utcNow.UtcDateTime;
        DateTime fromUtc = toUtc.Subtract(OpenFindingsLookback);

        IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts> buckets =
            await _findingsTrendReader.GetBucketCountsAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                fromUtc,
                toUtc,
                OpenFindingsLookback,
                cancellationToken).ConfigureAwait(false);

        if (!buckets.TryGetValue(fromUtc, out ComplianceDriftFindingsBucketCounts? bucketCounts))
            return 0d;

        return bucketCounts.OpenFindingsCount;
    }

    private async Task<double?> TryMeasurePolicyPackStaleHoursAsync(
        ScopeContext scope,
        DateTimeOffset utcNow,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<PolicyPackChangeLogEntry> changes = await _policyPackChangeLogRepository
            .GetByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, maxRows: 1, cancellationToken)
            .ConfigureAwait(false);

        PolicyPackChangeLogEntry? latestChange = changes.FirstOrDefault();

        if (latestChange is null)
            return null;

        return (utcNow.UtcDateTime - latestChange.ChangedUtc).TotalHours;
    }

    private Task PublishEscalationAsync(
        ScopeContext scope,
        string metricKey,
        double thresholdValue,
        double? observedValue,
        Guid? runId,
        string dayBucket,
        CancellationToken cancellationToken)
    {
        Guid driftSignalId = ComplianceDriftEscalationSignalId.CreateForScopeMetric(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            metricKey);

        return ComplianceDriftIntegrationEventPublishing.TryPublishEscalatedAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions,
            _logger,
            scope,
            driftSignalId,
            metricKey,
            thresholdValue,
            observedValue,
            runId,
            _authorityQueryService,
            _manifestHashService,
            dayBucket,
            cancellationToken);
    }
}
