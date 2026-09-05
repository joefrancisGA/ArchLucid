using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
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
public sealed class BuyerProofPackBuilderRoiFreshnessTests
{
    private static readonly Guid RunId = Guid.Parse("33333333-4444-5555-6666-777777777777");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [SkippableFact]
    public async Task TryBuildZipAsync_when_extractor_is_stale_emits_hold_freshness_in_deltas_json()
    {
        DateTime staleCollectionUtc = DateTime.UtcNow.AddDays(-45);
        ArchitectureRunDetail detail = BuildCommittedDetail(RunId);

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(RunId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = CreateSendablePilotRunDeltas(detail) with { EstimatedUsdSavings = 5000m };

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        Mock<ISponsorReviewPacketBuilder> sponsorPacket = new();
        sponsorPacket
            .Setup(b => b.BuildMarkdownAsync(RunId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("# Sponsor review packet");

        FirstValueReportBuilder markdownBuilder = CreateMarkdownBuilder(query.Object, deltas.Object);
        FirstValueReportPdfBuilder pdfBuilder = new(markdownBuilder);

        (ValueReportBuilder valueReport, Mock<IScopeContextProvider> scopeProvider) =
            CreateValueReportBuilderWithScope();

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PilotBaselineRecord
                {
                    TenantId = Scope.TenantId,
                    BaselineHoursPerReview = 40m,
                    BaselineReviewsPerQuarter = 12,
                    BaselineArchitectHourlyCost = 175m,
                    UpdatedUtc = DateTimeOffset.UtcNow,
                });

        RoiCostEvidenceCollectionResolver collectionResolver =
            CreateResolverWithStaleRunLinkedTimestamp(RunId, staleCollectionUtc);

        BuyerProofPackBuilder sut = new(
            markdownBuilder,
            pdfBuilder,
            sponsorPacket.Object,
            query.Object,
            deltas.Object,
            valueReport,
            scopeProvider.Object,
            pilotBaselines.Object,
            collectionResolver,
            Mock.Of<ArchLucid.Persistence.Queries.IAuthorityQueryService>(),
            Mock.Of<ArchLucid.Core.Manifest.IManifestHashService>());

        BuyerProofPackBuildResult? result =
            await sut.TryBuildZipAsync(RunId.ToString(), "http://localhost:5000");

        result.Should().NotBeNull();

        string deltasJson = await ReadZipEntryTextAsync(result!.ZipBytes, "pilot-run-deltas.json");

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        root.GetProperty("roiSourceFreshnessDisposition").GetString().Should().Be("HOLD");
        root.GetProperty("extractorCollectionTimestampUtc").GetDateTime().Should().Be(staleCollectionUtc);
    }

    private static RoiCostEvidenceCollectionResolver CreateResolverWithStaleRunLinkedTimestamp(
        Guid runId,
        DateTime staleCollectionUtc)
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureExtractorPackageProvenance { CollectionTimestampUtc = staleCollectionUtc });
        azureRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        cloudRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, CloudProvider.Aws, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CloudInventoryExtractorPackageProvenance?)null);
        cloudRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, CloudProvider.Gcp, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CloudInventoryExtractorPackageProvenance?)null);

        return RoiCostEvidenceCollectionResolverTestSupport.Create(azureRepository.Object, cloudRepository.Object);
    }

    private static (ValueReportBuilder Builder, Mock<IScopeContextProvider> ScopeProvider) CreateValueReportBuilderWithScope()
    {
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
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
                    DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
                    12m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return (new ValueReportBuilder(metrics.Object, opt.Object), scopeProvider);
    }

    private static FirstValueReportBuilder CreateMarkdownBuilder(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas)
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
                    DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
                    12m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        ValueReportBuilder valueReport = new(metrics.Object, opt.Object);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator", ["AzureOpenAI:DeploymentName"] = "gpt-test" })
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
            .ReturnsAsync(
                new PilotBaselineRecord
                {
                    TenantId = Scope.TenantId,
                    BaselineHoursPerReview = 40m,
                    BaselineReviewsPerQuarter = 12,
                    BaselineArchitectHourlyCost = 175m,
                    UpdatedUtc = DateTimeOffset.UtcNow,
                });

        return new FirstValueReportBuilder(
            query,
            deltas,
            valueReport,
            scope.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            branding.Object,
            pilotBaselines.Object,
            FirstValueReportBuilderTestDoubles.CreateDefaultCostEvidenceResolver(),
            FirstValueReportBuilderTestDoubles.CreateDefaultFreshnessOptions(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            FirstValueReportBuilderTestDoubles.CreateGraphSnapshotRepository(),
            NullLogger<FirstValueReportBuilder>.Instance);
    }

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
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
            IsDemoTenant = false,
        };

    private static ArchitectureRunDetail BuildCommittedDetail(Guid runId)
    {
        ArchitectureRun run = new()
        {
            RunId = runId.ToString(),
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 1, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v1",
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        GoldenManifest manifest = new()
        {
            RunId = runId.ToString(),
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
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
        };
    }

    private static async Task<string> ReadZipEntryTextAsync(byte[] zipBytes, string entryPath)
    {
        await using MemoryStream zipStream = new(zipBytes);
        using ZipArchive zip = new(zipStream, ZipArchiveMode.Read);
        ZipArchiveEntry entry = zip.GetEntry(entryPath)!;
        await using Stream entryStream = entry.Open();
        using StreamReader reader = new(entryStream, Encoding.UTF8);

        return await reader.ReadToEndAsync();
    }
}
