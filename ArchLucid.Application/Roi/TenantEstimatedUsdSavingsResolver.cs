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
    IOptions<ValueReportComputationOptions> computationOptions,
    ILogger<TenantEstimatedUsdSavingsResolver> logger) : ITenantEstimatedUsdSavingsResolver
{
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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
            FindingsSnapshot? snapshot = await _findingsSnapshotRepository
                .GetByIdAsync(findingsSnapshotId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (snapshot is null)
                return null;

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            TenantCostSettingsRecord? tenantSettings = await _tenantCostSettingsRepository
                .TryGetAsync(scope.TenantId, cancellationToken)
                .ConfigureAwait(false);

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
}
