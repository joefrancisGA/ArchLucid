using ArchLucid.Application.Pilots;
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
public sealed class SponsorOnePagerPdfBuilderTests
{
    [SkippableFact]
    public async Task BuildPdfAsync_WhenRunMissing_ReturnsNull()
    {
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IOptionsMonitor<PublicSiteOptions>> site = new();
        site.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        PilotScorecardBuilder scorecard = new(
            runs.Object,
            extractorPackages.Object,
            scope.Object,
            NullLogger<PilotScorecardBuilder>.Instance);
        Mock<IPilotRunDeltaComputer> deltas = new();
        FirstValueReportBuilder markdown = CreateMarkdownBuilder(query.Object, deltas.Object);
        SponsorOnePagerPdfBuilder sut = new(query.Object, scorecard, deltas.Object, markdown, site.Object);

        byte[]? pdf = await sut.BuildPdfAsync("missing", "http://localhost:5000");

        pdf.Should().BeNull();
        runs.Verify(
            r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
        deltas.Verify(d => d.ComputeAsync(It.IsAny<ArchitectureRunDetail>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task BuildPdfAsync_WhenRunPresent_ReturnsPdfMagicBytes()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail("r-pdf-1");
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r-pdf-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        ScopeContext sc = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        scope.Setup(s => s.GetCurrentScope()).Returns(sc);
        runs.Setup(r => r.ListRecentInScopeAsync(sc, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunRecord
                {
                    TenantId = sc.TenantId,
                    WorkspaceId = sc.WorkspaceId,
                    ScopeProjectId = sc.ProjectId,
                    RunId = Guid.NewGuid(),
                    ProjectId = "default",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime().AddDays(-1),
                    CurrentManifestVersion = "v1",
                },
            ]);

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        PilotScorecardBuilder scorecard = new(
            runs.Object,
            extractorPackages.Object,
            scope.Object,
            NullLogger<PilotScorecardBuilder>.Instance);
        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateSendablePilotRunDeltas(detail));

        Mock<IOptionsMonitor<PublicSiteOptions>> site = new();
        site.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        FirstValueReportBuilder markdown = CreateMarkdownBuilder(query.Object, deltas.Object);
        SponsorOnePagerPdfBuilder sut = new(query.Object, scorecard, deltas.Object, markdown, site.Object);

        byte[]? pdf = await sut.BuildPdfAsync("r-pdf-1", "http://localhost:5000");

        pdf.Should().NotBeNull();
        pdf.Length.Should().BeGreaterThan(32);
        ReadOnlySpan<byte> head = pdf.AsSpan(0, 4);
        head[0].Should().Be((byte)'%');
        head[1].Should().Be((byte)'P');
        head[2].Should().Be((byte)'D');
        head[3].Should().Be((byte)'F');
    }

    [SkippableFact]
    public async Task BuildPdfAsync_WhenRoiBaselinesMissing_ThrowsSponsorPdfBlocked()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail("r-pdf-incomplete");
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r-pdf-incomplete", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        PilotScorecardBuilder scorecard = new(
            runs.Object,
            extractorPackages.Object,
            scope.Object,
            NullLogger<PilotScorecardBuilder>.Instance);
        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotRunDeltas
            {
                RunCreatedUtc = detail.Run.CreatedUtc,
                ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
                TimeToCommittedManifest = detail.Manifest.Metadata.CreatedUtc - detail.Run.CreatedUtc,
                FindingsBySeverity = [],
                AuditRowCount = 0,
                LlmCallCount = 0,
                LlmCallCountResolved = true,
                IsDemoTenant = false,
            });

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PilotBaselineRecord?)null);

        Mock<IOptionsMonitor<PublicSiteOptions>> site = new();
        site.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        FirstValueReportBuilder markdown = CreateMarkdownBuilder(query.Object, deltas.Object, pilotBaselines.Object);
        SponsorOnePagerPdfBuilder sut = new(query.Object, scorecard, deltas.Object, markdown, site.Object);

        Func<Task> act = () => sut.BuildPdfAsync("r-pdf-incomplete", "http://localhost:5000");

        await act.Should().ThrowAsync<SponsorFirstValuePdfBlockedException>();
    }

    [SkippableFact]
    public async Task BuildPdfAsync_WhenDemoTenant_ThrowsSponsorPdfBlocked()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail("r-pdf-demo");
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r-pdf-demo", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        PilotScorecardBuilder scorecard = new(
            runs.Object,
            extractorPackages.Object,
            scope.Object,
            NullLogger<PilotScorecardBuilder>.Instance);
        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotRunDeltas
            {
                RunCreatedUtc = detail.Run.CreatedUtc,
                ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
                TimeToCommittedManifest = detail.Manifest.Metadata.CreatedUtc - detail.Run.CreatedUtc,
                FindingsBySeverity = [],
                AuditRowCount = 0,
                LlmCallCount = 0,
                IsDemoTenant = true,
            });

        Mock<IOptionsMonitor<PublicSiteOptions>> siteDemo = new();
        siteDemo.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        FirstValueReportBuilder markdown = CreateMarkdownBuilder(query.Object, deltas.Object);
        SponsorOnePagerPdfBuilder sut = new(query.Object, scorecard, deltas.Object, markdown, siteDemo.Object);

        Func<Task> act = () => sut.BuildPdfAsync("r-pdf-demo", "http://localhost:5000");

        await act.Should().ThrowAsync<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*demo*");
    }

    private static FirstValueReportBuilder CreateMarkdownBuilder(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas,
        IPilotBaselineRepository? pilotBaselines = null)
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
                    8m,
                    "signup",
                    TimeProvider.System.GetUtcNow(),
                    6m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        ValueReportBuilder valueReport = new(metrics.Object, opt.Object);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

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

        IPilotBaselineRepository baselineRepo = pilotBaselines ?? CreateDefaultPilotBaselineRepository();

        return new FirstValueReportBuilder(
            query,
            deltas,
            valueReport,
            scope.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            branding.Object,
            baselineRepo,
            FirstValueReportBuilderTestDoubles.CreateDefaultCostEvidenceResolver(),
            FirstValueReportBuilderTestDoubles.CreateDefaultFreshnessOptions(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<FirstValueReportBuilder>.Instance);
    }

    private static IPilotBaselineRepository CreateDefaultPilotBaselineRepository()
    {
        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PilotBaselineRecord
                {
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    BaselineHoursPerReview = 40m,
                    BaselineReviewsPerQuarter = 12,
                    BaselineArchitectHourlyCost = 175m,
                    UpdatedUtc = DateTimeOffset.UtcNow,
                });

        return pilotBaselines.Object;
    }

    private static PilotRunDeltas CreateSendablePilotRunDeltas(ArchitectureRunDetail detail)
    {
        return new PilotRunDeltas
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            TimeToCommittedManifest = detail.Manifest.Metadata.CreatedUtc - detail.Run.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 3),
            ],
            AuditRowCount = 5,
            LlmCallCount = 2,
            IsDemoTenant = false,
        };
    }

    private static ArchitectureRunDetail BuildCommittedDetail(string runId)
    {
        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 2, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v1",
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        GoldenManifest manifest = new()
        {
            RunId = runId,
            SystemName = "Demo",
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = run.CreatedUtc.AddHours(2) },
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
