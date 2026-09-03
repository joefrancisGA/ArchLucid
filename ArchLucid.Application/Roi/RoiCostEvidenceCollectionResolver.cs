using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Resolves uploaded Azure/AWS/GCP inventory collection timestamps and presence for sponsor ROI surfaces.
/// </summary>
public sealed class RoiCostEvidenceCollectionResolver(
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackageRepository,
    IRunRepository runRepository,
    IRunEvidencePackagePinService runEvidencePackagePinService)
{
    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudInventoryExtractorPackageRepository =
        cloudInventoryExtractorPackageRepository
        ?? throw new ArgumentNullException(nameof(cloudInventoryExtractorPackageRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    public async Task<bool> HasAnyUploadedInventoryPackagesAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        if (await _azureExtractorPackageRepository
                .HasAnyInWorkspaceAsync(scope, cancellationToken)
                .ConfigureAwait(false))
        {
            return true;
        }

        CloudInventoryExtractorPackageDownloadRecord? awsDownload =
            await _cloudInventoryExtractorPackageRepository
                .TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Aws, cancellationToken)
                .ConfigureAwait(false);

        if (awsDownload is not null)
            return true;

        CloudInventoryExtractorPackageDownloadRecord? gcpDownload =
            await _cloudInventoryExtractorPackageRepository
                .TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Gcp, cancellationToken)
                .ConfigureAwait(false);

        return gcpDownload is not null;
    }

    public async Task<DateTime?> TryResolveLatestCollectionTimestampUtcAsync(
        ScopeContext scope,
        string? runId,
        CancellationToken cancellationToken)
    {
        if (Guid.TryParse(runId, out Guid runGuid))
        {
            DateTime? runScopedUtc = await TryResolveRunLinkedCollectionTimestampUtcAsync(
                    scope,
                    runGuid,
                    cancellationToken)
                .ConfigureAwait(false);

            if (runScopedUtc is not null)
                return runScopedUtc;
        }

        return await TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken).ConfigureAwait(false);
    }

    public async Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        DateTime? azureCollectionUtc = await _azureExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        DateTime? awsCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Aws, cancellationToken)
            .ConfigureAwait(false);

        DateTime? gcpCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Gcp, cancellationToken)
            .ConfigureAwait(false);

        return MaxUtc(azureCollectionUtc, awsCollectionUtc, gcpCollectionUtc);
    }

    private async Task<DateTime?> TryResolveRunLinkedCollectionTimestampUtcAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<EvidencePackagePin> pinnedEvidence =
            _runEvidencePackagePinService.ResolvePinsFromHeader(header);

        if (pinnedEvidence.Count > 0)
        {
            DateTime? fromPins = MaxUtc(pinnedEvidence.Select(static pin => pin.CollectionUtc).ToArray());

            if (fromPins is not null)
                return fromPins;
        }

        AzureExtractorPackageProvenance? azureProvenance =
            await _azureExtractorPackageRepository
                .TryGetLatestProvenanceByRunIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);

        CloudInventoryExtractorPackageProvenance? awsProvenance =
            await _cloudInventoryExtractorPackageRepository
                .TryGetLatestProvenanceByRunIdAsync(scope, runId, CloudProvider.Aws, cancellationToken)
                .ConfigureAwait(false);

        CloudInventoryExtractorPackageProvenance? gcpProvenance =
            await _cloudInventoryExtractorPackageRepository
                .TryGetLatestProvenanceByRunIdAsync(scope, runId, CloudProvider.Gcp, cancellationToken)
                .ConfigureAwait(false);

        return MaxUtc(
            azureProvenance?.CollectionTimestampUtc,
            awsProvenance?.CollectionTimestampUtc,
            gcpProvenance?.CollectionTimestampUtc);
    }

    private static DateTime? MaxUtc(params DateTime?[] timestamps)
    {
        DateTime? latest = null;

        foreach (DateTime? timestamp in timestamps)
        {
            if (timestamp is null)
                continue;

            DateTime normalizedUtc = timestamp.Value.Kind == DateTimeKind.Utc
                ? timestamp.Value
                : timestamp.Value.ToUniversalTime();

            if (latest is null || normalizedUtc > latest.Value)
                latest = normalizedUtc;
        }

        return latest;
    }
}
