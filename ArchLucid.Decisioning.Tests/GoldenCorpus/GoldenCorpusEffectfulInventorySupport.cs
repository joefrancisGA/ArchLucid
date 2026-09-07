using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusEffectfulInventorySupport
{
    internal static FindingAnalysisContext CreateAzurePinnedContext(
        Guid runId,
        Guid contextSnapshotId,
        Guid packageId,
        DateTime collectionUtc)
    {
        return new FindingAnalysisContext
        {
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            EvidencePin = new EvidencePackagePin
            {
                Provider = RunEvidencePackagePinService.AzureProvider,
                PackageId = packageId,
                CollectionUtc = collectionUtc,
            },
        };
    }

    internal static AzureExtractorPackageDownloadRecord CreateAzurePackage(Guid packageId, string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = packageId,
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    internal static Mock<IAzureExtractorPackageRepository> CreateSeededAzureRepository(
        ScopeContext scope,
        AzureExtractorPackageDownloadRecord download,
        DateTime collectionUtc)
    {
        Mock<IAzureExtractorPackageRepository> repository = new();

        repository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collectionUtc);

        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(scope, download.PackageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(download);

        return repository;
    }

    private static byte[] BuildZip(params (string Name, string Content)[] entries)
    {
        using MemoryStream stream = new();

        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach ((string name, string content) in entries)
            {
                ZipArchiveEntry entry = archive.CreateEntry(name);
                using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
                writer.Write(content);
            }
        }

        return stream.ToArray();
    }
}
