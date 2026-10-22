using ArchLucid.Contracts.Admin;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;

namespace ArchLucid.Api.Services.Admin;

public sealed partial class AdminDataConsistencyDiagnosticsService
{
    public async Task<OrphanComparisonRemediationResult> RemediateOrphanComparisonRecordsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new OrphanComparisonRemediationResult(dryRun, 0, []);

        DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
            DataConsistencyOrphanRemediationRegistry.ComparisonRecords,
            dryRun,
            maxRows,
            cancellationToken).ConfigureAwait(false);

        return new OrphanComparisonRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
    }

    /// <inheritdoc />
    public async Task<OrphanGoldenManifestRemediationResult> RemediateOrphanGoldenManifestsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new OrphanGoldenManifestRemediationResult(dryRun, 0, []);

        DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
            DataConsistencyOrphanRemediationRegistry.GoldenManifests,
            dryRun,
            maxRows,
            cancellationToken).ConfigureAwait(false);

        return new OrphanGoldenManifestRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
    }

    /// <inheritdoc />
    public async Task<OrphanFindingsSnapshotRemediationResult> RemediateOrphanFindingsSnapshotsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new OrphanFindingsSnapshotRemediationResult(dryRun, 0, []);

        DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
            DataConsistencyOrphanRemediationRegistry.FindingsSnapshots,
            dryRun,
            maxRows,
            cancellationToken).ConfigureAwait(false);

        return new OrphanFindingsSnapshotRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
    }
}
