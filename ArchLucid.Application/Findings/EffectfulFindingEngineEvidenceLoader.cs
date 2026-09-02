using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Wave-5 suggestion 43: resolve scoped extractor downloads from the pinned evidence package when present.
/// </summary>
public static class EffectfulFindingEngineEvidenceLoader
{
    public static async Task<AzureExtractorPackageDownloadRecord?> TryResolveAzureDownloadAsync(
        IAzureExtractorPackageRepository repository,
        ScopeContext scope,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(scope);

        if (analysisContext?.EvidencePin?.PackageId is Guid packageId && packageId != Guid.Empty)
        {
            AzureExtractorPackageDownloadRecord? pinned =
                await repository.TryGetDownloadByPackageIdAsync(scope, packageId, cancellationToken).ConfigureAwait(false);

            if (pinned is null)
            {
                throw new ConflictException(
                    $"Effectful finding engine blocked: pinned evidence package '{packageId:D}' is missing.");
            }

            return pinned;
        }

        return await repository.TryGetLatestDownloadInScopeAsync(scope, cancellationToken).ConfigureAwait(false);
    }

    public static async Task<CloudInventoryExtractorPackageDownloadRecord?> TryResolveCloudDownloadAsync(
        ICloudInventoryExtractorPackageRepository repository,
        ScopeContext scope,
        CloudProvider cloudProvider,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(scope);

        if (analysisContext?.EvidencePin?.PackageId is Guid packageId && packageId != Guid.Empty)
        {
            CloudInventoryExtractorPackageDownloadRecord? pinned =
                await repository.TryGetDownloadByPackageIdAsync(scope, cloudProvider, packageId, cancellationToken)
                    .ConfigureAwait(false);

            if (pinned is null)
            {
                throw new ConflictException(
                    $"Effectful finding engine blocked: pinned evidence package '{packageId:D}' is missing for {cloudProvider}.");
            }

            return pinned;
        }

        return await repository.TryGetLatestDownloadInScopeAsync(scope, cloudProvider, cancellationToken)
            .ConfigureAwait(false);
    }
}
