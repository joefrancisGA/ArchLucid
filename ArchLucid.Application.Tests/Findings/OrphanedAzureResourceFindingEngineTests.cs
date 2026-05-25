using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OrphanedAzureResourceFindingEngineTests
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
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1",
                "properties": {}
              }
            ]
            """;

        OrphanedAzureResourceFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("OrphanedAzureResource");
        findings[0].EngineType.Should().Be("orphaned-azure-resource");
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        findings[0].Payload.Should().BeOfType<RequirementFindingPayload>();
        findings[0].Title.Should().Contain("Microsoft.Compute/disks");
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(3);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(path => path.Contains("Attach the disk", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("Microsoft.Network/networkInterfaces", "Attach the NIC")]
    [InlineData("Microsoft.Network/publicIPAddresses", "Associate the public IP")]
    public async Task AnalyzeAsync_populates_resource_specific_alternative_paths(string resourceType, string expectedPathFragment)
    {
        string resourceIdType = resourceType.Replace('/', '.');
        string resourcesJson =
            $"""
            [
              {{
                "resourceType": "{resourceType}",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/{resourceIdType}/res1",
                "properties": {{}}
              }}
            ]
            """;

        OrphanedAzureResourceFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(3);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(path => path.Contains(expectedPathFragment, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_no_orphans_present()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1",
                "properties": { "managedBy": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1" }
              }
            ]
            """;

        OrphanedAzureResourceFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_package_missing()
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureExtractorPackageDownloadRecord?)null);

        OrphanedAzureResourceFindingEngine sut = new(CreateScopeProvider().Object, packageRepository.Object);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_resources_json_missing()
    {
        OrphanedAzureResourceFindingEngine sut = CreateSut(CreatePackageWithoutResourcesJson());

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static OrphanedAzureResourceFindingEngine CreateSut(AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(package);

        return new OrphanedAzureResourceFindingEngine(CreateScopeProvider().Object, packageRepository.Object);
    }

    private static Mock<IScopeContextProvider> CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);
        return scopeProvider;
    }

    private static AzureExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    private static AzureExtractorPackageDownloadRecord CreatePackageWithoutResourcesJson()
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("manifest.json", "{}")),
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
