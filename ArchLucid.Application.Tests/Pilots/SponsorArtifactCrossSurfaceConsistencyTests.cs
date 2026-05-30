using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
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
public sealed class SponsorArtifactCrossSurfaceConsistencyTests
{
    [Fact]
    public async Task First_value_markdown_and_pilot_deltas_share_run_manifest_and_findings_counts()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail();
        detail.Run.StructuralExecutionMode = StructuralExecutionMode.Simulator;

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = new()
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 2),
                new KeyValuePair<string, int>("Error", 1),
            ],
            AuditRowCount = 7,
            LlmCallCount = 4,
            TopFindingId = "top-finding-id",
            TopFindingSeverity = "Error",
            IsDemoTenant = false,
        };

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        FirstValueReportBuilder builder = CreateSut(query.Object, deltas.Object);
        string? markdown = await builder.BuildMarkdownAsync("r1", "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain("r1");
        markdown.Should().Contain("v2");
        markdown.Should().Contain("ROI and cost source classification");
        markdown.Should().Contain("BenchmarkAssumption");

        ValueReportSnapshot snapshot = CreateEmptySnapshot();
        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            computed,
            snapshot,
            extractorCollectionTimestampUtc: null,
            scorecardBaselines: null);

        response.ProofPackageCompleteness.Should().NotBeNull();
        response.ProofPackageCompleteness!.SupportRunIdPresent.Should().BeTrue();
        response.ProofPackageCompleteness.CommittedManifestPresent.Should().BeTrue();
        response.FindingsBySeverity.Single(f => f.Severity == "Error").Count.Should().Be(1);
        response.FindingsBySeverity.Single(f => f.Severity == "Warning").Count.Should().Be(2);
    }

    [Fact]
    public async Task Sponsor_one_pager_pdf_uses_same_pilot_deltas_as_markdown_and_api_response()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail();
        detail.Run.StructuralExecutionMode = StructuralExecutionMode.Simulator;

        PilotRunDeltas computed = new()
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 2),
                new KeyValuePair<string, int>("Error", 1),
            ],
            AuditRowCount = 7,
            LlmCallCount = 4,
            TopFindingId = "top-finding-id",
            TopFindingSeverity = "Error",
            IsDemoTenant = false,
        };

        ArchitectureRunDetail? capturedDetail = null;

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(It.IsAny<ArchitectureRunDetail>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureRunDetail, CancellationToken>((d, _) => capturedDetail = d)
            .ReturnsAsync(computed);

        FirstValueReportBuilder markdownBuilder = CreateSut(query.Object, deltas.Object);
        string? markdown = await markdownBuilder.BuildMarkdownAsync("r1", "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain("Simulator");

        ValueReportSnapshot snapshot = CreateEmptySnapshot();
        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            computed,
            snapshot,
            extractorCollectionTimestampUtc: null,
            scorecardBaselines: null);

        response.LlmCallCount.Should().Be(4);
        response.FindingsBySeverity.Single(f => f.Severity == "Error").Count.Should().Be(1);

        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        PilotScorecardBuilder scorecard = new(
            runs.Object,
            extractorPackages.Object,
            scope.Object,
            NullLogger<PilotScorecardBuilder>.Instance);

        Mock<IOptionsMonitor<PublicSiteOptions>> site = new();
        site.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        SponsorOnePagerPdfBuilder pdfBuilder = new(query.Object, scorecard, deltas.Object, site.Object);
        byte[]? pdf = await pdfBuilder.BuildPdfAsync("r1", "http://localhost:5000");

        pdf.Should().NotBeNull();
        pdf!.Length.Should().BeGreaterThan(32);
        pdf.AsSpan(0, 4).ToArray().Should().Equal([(byte)'%', (byte)'P', (byte)'D', (byte)'F']);

        capturedDetail.Should().NotBeNull();
        capturedDetail!.Run.RunId.Should().Be("r1");
        capturedDetail.Run.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Simulator);

        deltas.Verify(
            d => d.ComputeAsync(It.Is<ArchitectureRunDetail>(x => x.Run.RunId == "r1"), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    private static ValueReportSnapshot CreateEmptySnapshot() =>
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            0,
            0,
            0,
            0,
            0m,
            0m,
            0m,
            0m,
            0m,
            "estimate",
            0m,
            0m,
            0m,
            0m,
            0m,
            null,
            null,
            null,
            null,
            0,
            ReviewCycleBaselineProvenance.NoMeasurementYet,
            null,
            null,
            0,
            0,
            null,
            null);

    private static ArchitectureRunDetail BuildCommittedDetail()
    {
        GoldenManifest manifest = new()
        {
            RunId = "r1",
            SystemName = "test-system",
            Metadata = new ManifestMetadata
            {
                CreatedUtc = new DateTime(2026, 4, 1, 0, 5, 0, DateTimeKind.Utc),
                ManifestVersion = "v2",
            },
        };

        ArchitectureRun run = new()
        {
            RunId = "r1",
            RequestId = "req1",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v2",
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            Results = [],
            DecisionTraces = [],
        };
    }

    private static FirstValueReportBuilder CreateSut(
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
            .ReturnsAsync(new ValueReportRawMetrics([], 0, 0, 0, 0, 0, 0, null, null, null, null, 0, null, null, null));

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
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" })
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
            .ReturnsAsync((PilotBaselineRecord?)null);

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
            NullLogger<FirstValueReportBuilder>.Instance);
    }
}
