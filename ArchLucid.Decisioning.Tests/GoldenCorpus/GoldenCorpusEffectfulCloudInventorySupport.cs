using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusEffectfulCloudInventorySupport
{
    internal static CloudInventoryExtractorPackageDownloadRecord CreateCloudPackage(
        Guid packageId,
        string resourcesJson,
        IReadOnlyList<GoldenCorpusInventoryZipEntryDocument>? extraZipEntries = null)
    {
        List<(string Name, string Content)> entries = [("resources.json", resourcesJson)];
        GoldenCorpusEffectfulInventorySupport.AppendExtraZipEntriesForCloud(entries, extraZipEntries);

        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = packageId,
            OriginalFileName = "cloud-inventory.zip",
            PackageBytes = BuildZip(entries.ToArray()),
        };
    }

    internal static Mock<ICloudInventoryExtractorPackageRepository> CreateSeededCloudRepository(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CloudInventoryExtractorPackageDownloadRecord download,
        DateTime collectionUtc)
    {
        Mock<ICloudInventoryExtractorPackageRepository> repository = new();

        repository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                scope,
                cloudProvider,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(collectionUtc);

        repository
            .Setup(repo => repo.TryGetDownloadByPackageIdAsync(
                scope,
                cloudProvider,
                download.PackageId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(download);

        return repository;
    }

    internal static EvidencePackagePin CreateCloudEvidencePin(CloudProvider cloudProvider, Guid packageId, DateTime collectionUtc)
    {
        string provider = cloudProvider switch
        {
            CloudProvider.Aws => RunEvidencePackagePinService.AwsProvider,
            CloudProvider.Gcp => RunEvidencePackagePinService.GcpProvider,
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };

        return new EvidencePackagePin
        {
            Provider = provider,
            PackageId = packageId,
            CollectionUtc = collectionUtc,
        };
    }

    internal static CloudProvider ParseCloudProvider(string cloudProvider)
    {
        if (string.Equals(cloudProvider, "Aws", StringComparison.OrdinalIgnoreCase)
            || string.Equals(cloudProvider, nameof(CloudProvider.Aws), StringComparison.OrdinalIgnoreCase))
            return CloudProvider.Aws;

        if (string.Equals(cloudProvider, "Gcp", StringComparison.OrdinalIgnoreCase)
            || string.Equals(cloudProvider, nameof(CloudProvider.Gcp), StringComparison.OrdinalIgnoreCase))
            return CloudProvider.Gcp;

        throw new InvalidOperationException($"Unsupported golden corpus cloud provider '{cloudProvider}'.");
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
