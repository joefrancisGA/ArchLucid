using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

/// <summary>
///     Wave-10 suggestion 94: effectful finding tests must supply create-time evidence pins (no latest-in-scope fallback).
/// </summary>
internal static class EffectfulFindingEngineTestSupport
{
    public static FindingAnalysisContext CreateAzurePinnedContext(Guid packageId, DateTime? collectionUtc = null) =>
        CreatePinnedContext(RunEvidencePackagePinService.AzureProvider, packageId, collectionUtc);

    public static FindingAnalysisContext CreateCloudPinnedContext(CloudProvider provider, Guid packageId, DateTime? collectionUtc = null)
    {
        string pinProvider = provider switch
        {
            CloudProvider.Aws => RunEvidencePackagePinService.AwsProvider,
            CloudProvider.Gcp => RunEvidencePackagePinService.GcpProvider,
            _ => provider.ToString().ToLowerInvariant(),
        };

        return CreatePinnedContext(pinProvider, packageId, collectionUtc);
    }

    public static void SetupAzurePinnedDownload(
        Mock<IAzureExtractorPackageRepository> repository,
        ScopeContext scope,
        AzureExtractorPackageDownloadRecord download)
    {
        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(scope, download.PackageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(download);
    }

    public static void SetupAzurePinnedDownloadMissing(
        Mock<IAzureExtractorPackageRepository> repository,
        ScopeContext scope,
        Guid packageId)
    {
        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(scope, packageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureExtractorPackageDownloadRecord?)null);
    }

    public static void SetupCloudPinnedDownload(
        Mock<ICloudInventoryExtractorPackageRepository> repository,
        ScopeContext scope,
        CloudProvider provider,
        CloudInventoryExtractorPackageDownloadRecord download)
    {
        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(
                scope,
                provider,
                download.PackageId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(download);
    }

    public static void SetupCloudPinnedDownloadMissing(
        Mock<ICloudInventoryExtractorPackageRepository> repository,
        ScopeContext scope,
        CloudProvider provider,
        Guid packageId)
    {
        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(
                scope,
                provider,
                packageId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CloudInventoryExtractorPackageDownloadRecord?)null);
    }

    private static FindingAnalysisContext CreatePinnedContext(string provider, Guid packageId, DateTime? collectionUtc) => new()
    {
        RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        ContextSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        EvidencePin = new EvidencePackagePin
        {
            Provider = provider,
            PackageId = packageId,
            CollectionUtc = collectionUtc ?? DateTime.UtcNow,
        },
    };
}
