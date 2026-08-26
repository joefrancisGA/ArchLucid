using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

public sealed partial class SponsorRoiRunCollector
{
    public async Task<SponsorRoiBasisBreakdown> BuildBasisBreakdownAsync(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<Guid> snapshotIds = latestDetails
            .Select(static detail => detail.Run.FindingsSnapshotId)
            .Where(static id => id is Guid snapshotId && snapshotId != Guid.Empty)
            .Select(static id => id!.Value)
            .Distinct()
            .ToList();

        FindingsSnapshot?[] snapshotSlots = snapshotIds.Count == 0
            ? []
            : await BoundedParallelMap.MapAsync(
                snapshotIds,
                RunDetailRoiFanOutMaxConcurrent,
                async (snapshotId, ct) =>
                    await _findingsSnapshotRepository
                        .GetByIdAsync(scope, snapshotId, ct)
                        .ConfigureAwait(false),
                cancellationToken).ConfigureAwait(false);

        List<FindingsSnapshot> snapshots = snapshotSlots
            .Where(static snapshot => snapshot is not null)
            .Select(static snapshot => snapshot!)
            .ToList();

        DateTimeOffset since = TimeProvider.System.UtcNowDateTime().Subtract(FindingDispositionTrailWindow.BasisBreakdownLookback);
        IReadOnlyList<FindingReviewEventRecord> trailEvents =
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken).ConfigureAwait(false);
        TenantCostSettingsRecord? tenantSettings = await _tenantCostSettingsRepository
            .TryGetAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        return DispositionAwareRoiBasisCalculator.Compute(
            snapshots,
            trailEvents,
            activeWaivers,
            tenantSettings,
            _valueReportComputationOptions);
    }

    public static List<SystemicIssueSummary> AggregateTopSystemicIssues(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        ILogger? logger = null)
    {
        IReadOnlyList<ArchitectureFinding> deduped = CollectDedupedActiveFindings(latestDetails, logger);

        return deduped
            .GroupBy(static finding => (Category: NormalizeCategory(finding.Category), Severity: finding.Severity.ToString()))
            .Select(static group => new SystemicIssueSummary
            {
                Category = group.Key.Category,
                Severity = group.Key.Severity,
                Count = group.Count(),
            })
            .OrderByDescending(static issue => issue.Count)
            .ThenBy(static issue => issue.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static issue => issue.Severity, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    public static IReadOnlyList<ArchitectureFinding> CollectDedupedActiveFindings(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        ILogger? logger = null)
    {
        IEnumerable<ArchitectureFinding> allFindings = latestDetails
            .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings));

        IEnumerable<ArchitectureFinding> muted = allFindings.Where(static finding => finding.IsMuted);

        if (logger is not null)
            SponsorRoiFindingExclusionLogger.LogMutedFindings(logger, muted);

        IEnumerable<ArchitectureFinding> activeFindings = allFindings.Where(static finding => !finding.IsMuted);

        IEnumerable<ArchitectureFinding> deduped = logger is null
            ? SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings)
            : SponsorRoiFindingExclusionLogger.DeduplicateWithLogging(logger, activeFindings);

        return deduped.ToList();
    }

    /// <summary>
    ///     Authoritative portfolio headline: open + needs-evidence estimated USD (V1 §2.8).
    ///     Shared by single-tenant summary, board pack, and cross-tenant portfolio rollup.
    /// </summary>
    public static decimal ComputeHeadlineSavingsFromBasis(SponsorRoiBasisBreakdown basis)
    {
        ArgumentNullException.ThrowIfNull(basis);

        return basis.OpenEstimatedUsd + basis.NeedsEvidenceUsd;
    }

    public static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }

    public static string ResolveSystemName(RunSummary summary, ArchitectureRunDetail detail)
    {
        if (!string.IsNullOrWhiteSpace(summary.SystemName))
            return summary.SystemName.Trim();

        if (!string.IsNullOrWhiteSpace(detail.Manifest?.SystemName))
            return detail.Manifest.SystemName.Trim();

        return UnspecifiedSystemName;
    }

    public static string ResolveEnvironmentLabel(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        foreach (ManifestService service in detail.Manifest?.Services ?? [])
        {
            foreach (string? tag in service.Tags)
            {
                if (tag is null)
                    continue;

                if (!TryParseEnvironmentTag(tag, out string environment))
                    continue;

                return environment;
            }
        }

        return "unspecified";
    }

    public static string NormalizeSystemName(string? systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return UnspecifiedSystemName;

        return systemName.Trim();
    }

    public static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }

    private static bool TryParseEnvironmentTag(string tag, out string environment)
    {
        environment = string.Empty;

        if (string.IsNullOrWhiteSpace(tag))
            return false;

        if (tag.StartsWith("env:", StringComparison.OrdinalIgnoreCase))
        {
            environment = tag["env:".Length..].Trim();
            return !string.IsNullOrWhiteSpace(environment);
        }

        if (tag.StartsWith("environment:", StringComparison.OrdinalIgnoreCase))
        {
            environment = tag["environment:".Length..].Trim();
            return !string.IsNullOrWhiteSpace(environment);
        }

        return false;
    }
}
