using ArchLucid.Capabilities.Cost;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

public sealed class TenantEstimatedUsdSavingsResolver(
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IScopeContextProvider scopeContextProvider,
    IReservationCoverageProvider reservationCoverageProvider,
    IOptions<ValueReportComputationOptions> computationOptions,
    ILogger<TenantEstimatedUsdSavingsResolver> logger) : ITenantEstimatedUsdSavingsResolver
{
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IReservationCoverageProvider _reservationCoverageProvider =
        reservationCoverageProvider ?? throw new ArgumentNullException(nameof(reservationCoverageProvider));

    private readonly ValueReportComputationOptions _computationOptions =
        computationOptions?.Value ?? throw new ArgumentNullException(nameof(computationOptions));

    private readonly ILogger<TenantEstimatedUsdSavingsResolver> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<decimal?> ResolveFromFindingsSnapshotIdAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken)
    {
        if (findingsSnapshotId is null || findingsSnapshotId == Guid.Empty)
            return null;

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            FindingsSnapshot? snapshot = await _findingsSnapshotRepository
                .GetByIdAsync(scope, findingsSnapshotId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (snapshot is null)
                return null;
            TenantCostSettingsRecord? tenantSettings = await _tenantCostSettingsRepository
                .TryGetAsync(scope.TenantId, cancellationToken)
                .ConfigureAwait(false);

            await LogReservationReallocationsAsync(snapshot.Findings, cancellationToken).ConfigureAwait(false);

            return TenantAdjustedFindingsSavingsCalculator.ComputeTotal(snapshot, tenantSettings, _computationOptions);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Estimated USD savings unavailable for findings snapshot {SnapshotId}.",
                findingsSnapshotId);

            return null;
        }
    }

    private async Task LogReservationReallocationsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken)
    {
        if (findings.Count == 0 || !_logger.IsEnabled(LogLevel.Debug))
            return;

        foreach (Finding finding in findings)
        {
            string? resourceId = TryReadAffectedResourceId(finding);

            if (string.IsNullOrWhiteSpace(resourceId))
                continue;

            decimal coverage = await _reservationCoverageProvider
                .GetCoverageAsync(resourceId, cancellationToken)
                .ConfigureAwait(false);

            if (coverage <= 0m)
                continue;

            _logger.LogDebug(
                "Reallocated RI: finding {FindingId} resource {ResourceId} has {CoveragePct}% reservation coverage; USD savings preserved.",
                finding.FindingId,
                resourceId,
                coverage);
        }
    }

    private static string? TryReadAffectedResourceId(Finding finding)
    {
        if (finding.Properties is null)
            return null;

        foreach (KeyValuePair<string, string> pair in finding.Properties)
        {
            if (pair.Key.Equals("resourceId", StringComparison.OrdinalIgnoreCase)
                || pair.Key.Equals("affectedResourceId", StringComparison.OrdinalIgnoreCase))
            {
                return string.IsNullOrWhiteSpace(pair.Value) ? null : pair.Value.Trim();
            }
        }

        return null;
    }
}
