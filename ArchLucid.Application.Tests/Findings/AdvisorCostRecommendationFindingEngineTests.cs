using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
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
public sealed class AdvisorCostRecommendationFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_returns_advisor_cost_findings_from_zip()
    {
        const string advisorCostJson =
            """
            {
              "recommendations": [
                {
                  "id": "rec-1",
                  "category": "Cost",
                  "description": "Right-size underutilized VM",
                  "annualSavingsAmount": 500
                }
              ]
            }
            """;

        AdvisorCostRecommendationFindingEngine sut = CreateSut(CreatePackage(advisorCostJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("AdvisorCostRecommendation");
        findings[0].EngineType.Should().Be("advisor-cost-recommendation");
        findings[0].Payload.Should().BeOfType<AdvisorCostRecommendationFindingPayload>();
        ((AdvisorCostRecommendationFindingPayload)findings[0].Payload!).EstimatedAnnualSavingsUsd.Should().Be(500m);
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_advisor_cost_json_missing()
    {
        AdvisorCostRecommendationFindingEngine sut = CreateSut(CreatePackageWithoutAdvisorCost());

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static AdvisorCostRecommendationFindingEngine CreateSut(AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        packageRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(package);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        return new AdvisorCostRecommendationFindingEngine(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private static AzureExtractorPackageDownloadRecord CreatePackage(string advisorCostJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("advisor-cost.json", advisorCostJson)),
        };
    }

    private static AzureExtractorPackageDownloadRecord CreatePackageWithoutAdvisorCost()
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
