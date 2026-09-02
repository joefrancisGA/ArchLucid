using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Wave-5 suggestion 43 / wave-6 suggestion 55: resolve scoped extractor downloads from create-time pins.
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

        EvidencePackagePin? pinned = ResolvePinnedPin(
            analysisContext,
            RunEvidencePackagePinService.AzureProvider);

        if (pinned?.PackageId is Guid packageId && packageId != Guid.Empty)
        {
            AzureExtractorPackageDownloadRecord? pinnedDownload =
                await repository.TryGetDownloadByPackageIdAsync(scope, packageId, cancellationToken).ConfigureAwait(false);

            if (pinnedDownload is null)
            {
                throw new ConflictException(
                    $"Effectful finding engine blocked: pinned evidence package '{packageId:D}' is missing.");
            }

            return pinnedDownload;
        }

        if (analysisContext?.HasCreateTimeEvidencePinCommitment == true)
        {
            throw new ConflictException(
                "Effectful finding engine blocked: run has create-time evidence pin commitment but no Azure package was pinned.");
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

        string provider = cloudProvider switch
        {
            CloudProvider.Aws => RunEvidencePackagePinService.AwsProvider,
            CloudProvider.Gcp => RunEvidencePackagePinService.GcpProvider,
            _ => cloudProvider.ToString().ToLowerInvariant(),
        };

        EvidencePackagePin? pinned = ResolvePinnedPin(analysisContext, provider);

        if (pinned?.PackageId is Guid packageId && packageId != Guid.Empty)
        {
            CloudInventoryExtractorPackageDownloadRecord? pinnedDownload =
                await repository.TryGetDownloadByPackageIdAsync(scope, cloudProvider, packageId, cancellationToken)
                    .ConfigureAwait(false);

            if (pinnedDownload is null)
            {
                throw new ConflictException(
                    $"Effectful finding engine blocked: pinned evidence package '{packageId:D}' is missing for {cloudProvider}.");
            }

            return pinnedDownload;
        }

        if (analysisContext?.HasCreateTimeEvidencePinCommitment == true
            || analysisContext?.EvidencePins is { Count: > 0 })
        {
            throw new ConflictException(
                $"Effectful finding engine blocked: run has create-time evidence pin commitment but no {cloudProvider} package was pinned.");
        }

        return await repository.TryGetLatestDownloadInScopeAsync(scope, cloudProvider, cancellationToken)
            .ConfigureAwait(false);
    }

    private static EvidencePackagePin? ResolvePinnedPin(FindingAnalysisContext? analysisContext, string provider)
    {
        if (analysisContext?.EvidencePins is { Count: > 0 } pins)
        {
            return pins.FirstOrDefault(pin =>
                string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase));
        }

        if (analysisContext?.EvidencePin is not null
            && string.Equals(analysisContext.EvidencePin.Provider, provider, StringComparison.OrdinalIgnoreCase))
        {
            return analysisContext.EvidencePin;
        }

        return null;
    }
}
