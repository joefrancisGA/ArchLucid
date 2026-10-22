using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Pilots;

public sealed class PilotReportCardService(
    IPilotReportCardMetricsReader metricsReader,
    IScopeContextProvider scopeContextProvider) : IPilotReportCardService
{
    private readonly IPilotReportCardMetricsReader _metricsReader =
        metricsReader ?? throw new ArgumentNullException(nameof(metricsReader));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc/>
    public async Task<PilotReportCard> GenerateReportCardAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        CancellationToken cancellationToken)
    {
        ScopeContext current = _scopeContextProvider.GetCurrentScope();
        EnsureScopeMatches(current, tenantId, workspaceId, scopeProjectId);
        PilotReportCardScopeMetrics raw =
            await _metricsReader.ReadAsync(tenantId, workspaceId, scopeProjectId, cancellationToken);

        DateTimeOffset? periodStartUtc = ToUtcOffset(raw.PeriodStartUtc);
        DateTimeOffset? periodEndUtc = ToUtcOffset(raw.PeriodEndUtc);

        List<PilotReportCardFindingSeverity> severities =
            raw.FindingsBySeverity
                .Select(static bucket =>
                    new PilotReportCardFindingSeverity
                    {
                        Severity = bucket.Severity,
                        Count =
                            bucket.SeverityBucketCount > int.MaxValue
                                ? int.MaxValue
                                : (int)Math.Min(bucket.SeverityBucketCount, int.MaxValue)
                    })
                .ToList();

        return new PilotReportCard
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = scopeProjectId,
            PeriodStartUtc = periodStartUtc,
            PeriodEndUtc = periodEndUtc,
            TotalCompletedRuns = raw.TotalCompletedRuns,
            AverageRequestToCommitWallSeconds = raw.AverageRequestToCommitWallSeconds,
            TotalFindings = raw.TotalFindings,
            FindingsBySeverity = severities,
            GovernanceApprovalActions = raw.GovernanceApprovalActions,
            GovernanceRejections = raw.GovernanceRejections,
            ExportsGenerated = raw.ExportsGenerated,
            UniqueSynthesizedArtifactTypes = raw.UniqueSynthesizedArtifactTypes,
        };
    }

    private static void EnsureScopeMatches(ScopeContext current, Guid tenantId, Guid workspaceId, Guid scopeProjectId)
    {
        ArgumentNullException.ThrowIfNull(current);

        if (tenantId != current.TenantId || workspaceId != current.WorkspaceId || scopeProjectId != current.ProjectId)
            throw new ArgumentException(
                "Report card ids must mirror the authenticated workspace scope.", nameof(tenantId));
    }

    private static DateTimeOffset? ToUtcOffset(DateTime? utc)
    {
        if (utc is null)
            return null;

        DateTime utcValue = utc.Value.Kind == DateTimeKind.Utc ? utc.Value : DateTime.SpecifyKind(utc.Value,
            DateTimeKind.Utc);

        return new DateTimeOffset(utcValue);
    }
}
