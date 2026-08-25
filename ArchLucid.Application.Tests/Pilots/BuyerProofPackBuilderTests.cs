using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuyerProofPackBuilderTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TryBuildZipAsync_stale_extractor_timestamp_maps_hold_freshness_like_api_path()
    {
        DateTime staleCollectionUtc = DateTime.UtcNow.AddDays(-45);
        ArchitectureRunDetail detail = BuildCommittedDetail("r-proof-pack-1");

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = CreateSendablePilotRunDeltas(detail) with
        {
            EstimatedUsdSavings = 5000m,
            LlmCallCountResolved = true,
        };

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        Mock<IAzureExtractorPackageRepository> azurePackages = new();
        azurePackages
            .Setup(r => r.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(staleCollectionUtc);

        Mock<ICloudInventoryExtractorPackageRepository> cloudPackages = new();
        RoiCostEvidenceCollectionResolver collectionResolver = new(azurePackages.Object, cloudPackages.Object);

        FirstValueReportBuilder markdownBuilder = CreateMarkdownBuilder(query.Object, deltas.Object);
        FirstValueReportPdfBuilder pdfBuilder = new(markdownBuilder);

        Mock<ISponsorReviewPacketBuilder> sponsorPacket = new();
        sponsorPacket
            .Setup(p => p.BuildMarkdownAsync(detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("# Sponsor review packet");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateDefaultPilotBaselineRecord());

        BuyerProofPackBuilder sut = new(
            markdownBuilder,
            pdfBuilder,
            sponsorPacket.Object,
            query.Object,
            deltas.Object,
            CreateValueReportBuilder(),
            scopeProvider.Object,
            pilotBaselines.Object,
            collectionResolver);

        BuyerProofPackBuildResult? result =
            await sut.TryBuildZipAsync(detail.Run.RunId, "http://localhost:5000");

        result.Should().NotBeNull("buyer proof pack should build for a sendable committed run");

        string deltasJson = ReadZipEntryText(result!.ZipBytes, "pilot-run-deltas.json");
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        root.GetProperty("roiSourceFreshnessDisposition").GetString().Should().Be("HOLD");
        root.GetProperty("extractorCollectionTimestampUtc").GetDateTime().Should().Be(staleCollectionUtc);
    }

    private static string ReadZipEntryText(byte[] zipBytes, string entryName)
    {
        using MemoryStream zipStream = new(zipBytes);
        using ZipArchive archive = new(zipStream, ZipArchiveMode.Read);

        ZipArchiveEntry? entry = archive.GetEntry(entryName);
        entry.Should().NotBeNull();

        using StreamReader reader = new(entry!.Open());
        return reader.ReadToEnd();
    }

    private static ValueReportBuilder CreateValueReportBuilder()
    {
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ValueReportRawMetrics(
                    [],
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    40m,
                    "signup",
                    TimeProvider.System.GetUtcNow(),
                    12m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        return new ValueReportBuilder(metrics.Object, opt.Object);
    }

    private static FirstValueReportBuilder CreateMarkdownBuilder(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:DeploymentName"] = "gpt-test",
                })
            .Build();

        Mock<IOptionsMonitor<PublicSiteOptions>> siteOpts = new();
        siteOpts.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        Mock<ITenantFirstValueReportBrandingRepository> branding = new();
        branding
            .Setup(b => b.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantFirstValueReportBrandingRow?)null);

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateDefaultPilotBaselineRecord());

        return new FirstValueReportBuilder(
            query,
            deltas,
            CreateValueReportBuilder(),
            scope.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            branding.Object,
            pilotBaselines.Object,
            NullLogger<FirstValueReportBuilder>.Instance);
    }

    private static PilotBaselineRecord CreateDefaultPilotBaselineRecord() =>
        new()
        {
            TenantId = Scope.TenantId,
            BaselineHoursPerReview = 40m,
            BaselineReviewsPerQuarter = 12,
            BaselineArchitectHourlyCost = 175m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

    private static PilotRunDeltas CreateSendablePilotRunDeltas(ArchitectureRunDetail detail) =>
        new()
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            TimeToCommittedManifest = detail.Manifest.Metadata.CreatedUtc - detail.Run.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 2),
                new KeyValuePair<string, int>("Error", 1),
            ],
            AuditRowCount = 7,
            LlmCallCount = 4,
            LlmCallCountResolved = true,
            TopFindingId = "top-finding-id",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse
            {
                RunId = detail.Run.RunId,
                FindingId = "top-finding-id",
                ManifestVersion = detail.Manifest.Metadata.ManifestVersion,
                FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            },
            IsDemoTenant = false,
        };

    private static ArchitectureRunDetail BuildCommittedDetail(string runId)
    {
        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 1, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v1",
        };

        GoldenManifest manifest = new()
        {
            RunId = runId,
            SystemName = "DemoSystem",
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = run.CreatedUtc },
            Governance = new ManifestGovernance(),
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            Results = [],
            DecisionTraces = [],
        };
    }
}
