using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class OrphanedGcpResourceFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_returns_orphan_findings_from_resources_json()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo/zones/us-central1-a/disks/orphan-disk",
                "resourceType": "compute.googleapis.com/Disk",
                "location": "us-central1-a",
                "properties": { "status": "READY", "users": [] }
              }
            ]
            """;

        OrphanedGcpResourceFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("OrphanedGcpResource");
        findings[0].EngineType.Should().Be("orphaned-gcp-resource");
    }

    private static OrphanedGcpResourceFindingEngine CreateSut(CloudInventoryExtractorPackageDownloadRecord package)
    {
        Mock<ICloudInventoryExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                TestScope,
                CloudProvider.Gcp,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        packageRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(
                TestScope,
                CloudProvider.Gcp,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(package);

        return new OrphanedGcpResourceFindingEngine(
            CreateScopeProvider().Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private static Mock<IScopeContextProvider> CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);
        return scopeProvider;
    }

    private static CloudInventoryExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "gcp-inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
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
