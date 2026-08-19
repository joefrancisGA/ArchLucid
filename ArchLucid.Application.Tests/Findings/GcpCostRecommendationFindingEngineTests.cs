using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GcpCostRecommendationFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_returns_gcp_cost_findings_from_zip()
    {
        const string costJson =
            """
            {
              "recommendations": [
                {
                  "name": "gcp-rec-1",
                  "recommenderSubtype": "CHANGE_MACHINE_TYPE",
                  "primaryImpact": {
                    "costProjection": {
                      "cost": {
                        "units": "-50"
                      }
                    }
                  }
                }
              ]
            }
            """;

        GcpCostRecommendationFindingEngine sut = CreateSut(CreatePackage("recommender-cost.json", costJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("GcpCostRecommendation");
        findings[0].EngineType.Should().Be("gcp-cost-recommendation");
        findings[0].Title.Should().Contain("CHANGE_MACHINE_TYPE");
        findings[0].Payload.Should().BeOfType<AdvisorCostRecommendationFindingPayload>();
        AdvisorCostRecommendationFindingPayload payload = (AdvisorCostRecommendationFindingPayload)findings[0].Payload!;
        payload.EstimatedAnnualSavingsUsd.Should().Be(600m);
        payload.ExtractorArtifactFileName.Should().Be("recommender-cost.json");
        findings[0].Trace.RulesApplied.Should().Contain("extractor-gcp-cost-json");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_cost_json_missing()
    {
        GcpCostRecommendationFindingEngine sut = CreateSut(CreatePackage("manifest.json", "{}"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GcpCostRecommendationFindingEngine CreateSut(CloudInventoryExtractorPackageDownloadRecord package)
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

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        return new GcpCostRecommendationFindingEngine(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private static CloudInventoryExtractorPackageDownloadRecord CreatePackage(string entryName, string content)
    {
        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "gcp-inventory.zip",
            PackageBytes = BuildZip((entryName, content)),
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
