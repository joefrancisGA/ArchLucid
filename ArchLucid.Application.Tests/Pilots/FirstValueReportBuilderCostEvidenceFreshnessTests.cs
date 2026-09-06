using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Pilots;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Queries;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ValueReports;
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
[Trait("Category", "Unit")]
public sealed class FirstValueReportBuilderCostEvidenceFreshnessTests
{
    private static readonly Guid RunId = Guid.Parse("33333333-4444-5555-6666-777777777777");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task BuildMarkdownAsync_when_run_linked_extractor_is_fresh_emits_fresh_badge_without_roi_label_wording()
    {
        DateTime freshCollectionUtc = DateTime.UtcNow.AddDays(-2);
        ArchitectureRunDetail detail = BuildCommittedDetail(RunId);

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(RunId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = CreateSendablePilotRunDeltas(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        RoiCostEvidenceCollectionResolver collectionResolver =
            CreateResolverWithRunLinkedTimestamp(RunId, freshCollectionUtc);

        FirstValueReportBuilder sut = CreateSut(query.Object, deltas.Object, collectionResolver);
        string? markdown = await sut.BuildMarkdownAsync(RunId.ToString(), "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain("**Evidence freshness:** **Fresh** (`fresh`)");
        markdown.Should().Contain("**Evidence source:** **Uploaded actual/amortized** (`uploaded-actual-amortized`)");
    }

    [Fact]
    public async Task BuildMarkdownAsync_when_run_linked_extractor_is_stale_for_sponsor_handoff_emits_stale_badge_before_ninety_day_window()
    {
        DateTime staleCollectionUtc = DateTime.UtcNow.AddDays(-45);
        ArchitectureRunDetail detail = BuildCommittedDetail(RunId);

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(RunId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = CreateSendablePilotRunDeltas(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        RoiCostEvidenceCollectionResolver collectionResolver =
            CreateResolverWithRunLinkedTimestamp(RunId, staleCollectionUtc);

        FirstValueReportBuilder sut = CreateSut(query.Object, deltas.Object, collectionResolver);
        string? markdown = await sut.BuildMarkdownAsync(RunId.ToString(), "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain("**Evidence freshness:** **Stale** (`stale`)");
        markdown.Should().Contain("**HOLD posture:**");
    }

    [Fact]
    public async Task BuildMarkdownAsync_when_run_linked_extractor_is_stale_emits_stale_badge()
    {
        DateTime staleCollectionUtc = DateTime.UtcNow.AddDays(-120);
        ArchitectureRunDetail detail = BuildCommittedDetail(RunId);

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(RunId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = CreateSendablePilotRunDeltas(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        RoiCostEvidenceCollectionResolver collectionResolver =
            CreateResolverWithRunLinkedTimestamp(RunId, staleCollectionUtc);

        FirstValueReportBuilder sut = CreateSut(query.Object, deltas.Object, collectionResolver);
        string? markdown = await sut.BuildMarkdownAsync(RunId.ToString(), "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain("**Evidence freshness:** **Stale** (`stale`)");
        markdown.Should().Contain("**HOLD posture:**");
    }

    [Fact]
    public void PilotCostEvidenceFreshnessBadgeResolver_maps_stale_and_fresh_from_extractor_timestamp()
    {
        DateTime evaluationUtc = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

        PilotCostEvidenceFreshnessBadgeResolver.Resolve(
                evaluationUtc.AddDays(-10),
                isDemoTenant: false,
                evaluationUtc,
                staleAfterDays: 90)
            .Should().Be(Contracts.Roi.RoiCostEvidenceFreshness.Fresh);

        PilotCostEvidenceFreshnessBadgeResolver.Resolve(
                evaluationUtc.AddDays(-120),
                isDemoTenant: false,
                evaluationUtc,
                staleAfterDays: 90)
            .Should().Be(Contracts.Roi.RoiCostEvidenceFreshness.Stale);
    }

    private static RoiCostEvidenceCollectionResolver CreateResolverWithRunLinkedTimestamp(
        Guid runId,
        DateTime collectionUtc)
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureExtractorPackageProvenance { CollectionTimestampUtc = collectionUtc });
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

    private static FirstValueReportBuilder CreateSut(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas,
        RoiCostEvidenceCollectionResolver collectionResolver)
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

        ValueReportBuilder valueReport = new(metrics.Object, opt.Object);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator", ["AzureOpenAI:DeploymentName"] = "gpt-test" })
            .Build();

        Mock<IOptionsMonitor<PublicSiteOptions>> siteOpts = new();
        siteOpts.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        ITenantBrandingService branding = FirstValueReportBrandingTestDoubles.CreateProductBrandService().Object;
        ITenantReportBrandingApplyHelper reportBranding =
            FirstValueReportBrandingTestDoubles.CreateApplyHelper(branding);

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

        ManifestHashService manifestHashService = new();
        IAuthorityQueryService authorityQuery =
            SealedExportReceiptTestSupport.CreateAuthorityQueryService(RunId, manifestHashService);

        return new FirstValueReportBuilder(
            query,
            deltas,
            valueReport,
            scopeProvider.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            reportBranding,
            pilotBaselines.Object,
            collectionResolver,
            FirstValueReportBuilderTestDoubles.CreateDefaultFreshnessOptions(),
            authorityQuery,
            manifestHashService,
            FirstValueReportBuilderTestDoubles.CreateGraphSnapshotRepository(),
            Mock.Of<ArchLucid.Persistence.Data.Repositories.IAgentExecutionTraceRepository>(),
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
}
