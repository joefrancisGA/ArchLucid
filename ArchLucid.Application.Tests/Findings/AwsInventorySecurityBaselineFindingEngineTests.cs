using System.IO.Compression;
using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class AwsInventorySecurityBaselineFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_emits_security_baseline_finding_from_resources_json()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "sg-admin-open",
                "resourceType": "AWS::EC2::SecurityGroup",
                "properties": {
                  "securityGroupIngress": [
                    {
                      "cidrIp": "0.0.0.0/0",
                      "fromPort": 3389,
                      "toPort": 3389
                    }
                  ]
                }
              }
            ]
            """;

        (AwsInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("AwsInventorySecurityBaseline");
        findings[0].EngineType.Should().Be("aws-inventory-security-baseline");
        findings[0].Category.Should().Be("Security");
        findings[0].Payload.Should().BeOfType<RequirementFindingPayload>();
    }

    [Fact]
    public async Task AnalyzeAsync_throws_ConflictException_when_no_evidence_pin()
    {
        (AwsInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext? context) = CreateSutWithoutPin();

        Func<Task> act = () => sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    private static (AwsInventorySecurityBaselineFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        CloudInventoryExtractorPackageDownloadRecord package)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<ICloudInventoryExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(static repository =>
                repository.TryGetLatestCollectionTimestampUtcInScopeAsync(
                    It.IsAny<ScopeContext>(),
                    CloudProvider.Aws,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupCloudPinnedDownload(
            packageRepository,
            TestScope,
            CloudProvider.Aws,
            package);

        FindingAnalysisContext context =
            EffectfulFindingEngineTestSupport.CreateCloudPinnedContext(CloudProvider.Aws, package.PackageId);

        AwsInventorySecurityBaselineFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 30 }));

        return (engine, context);
    }

    private static (AwsInventorySecurityBaselineFindingEngine Engine, FindingAnalysisContext? Context) CreateSutWithoutPin()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<ICloudInventoryExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(static repository =>
                repository.TryGetLatestCollectionTimestampUtcInScopeAsync(
                    It.IsAny<ScopeContext>(),
                    CloudProvider.Aws,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);

        AwsInventorySecurityBaselineFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 30 }));

        return (engine, null);
    }

    private static CloudInventoryExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    private static byte[] BuildZip(params (string Name, string Content)[] entries)
    {
        using MemoryStream zipStream = new();

        using (ZipArchive archive = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach ((string name, string content) in entries)
            {
                ZipArchiveEntry entry = archive.CreateEntry(name, CompressionLevel.Optimal);

                using Stream entryStream = entry.Open();

                entryStream.Write(Encoding.UTF8.GetBytes(content));
            }
        }

        return zipStream.ToArray();
    }
}
