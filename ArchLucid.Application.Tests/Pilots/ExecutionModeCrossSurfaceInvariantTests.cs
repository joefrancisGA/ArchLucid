using ArchLucid.Application.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Trust;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Trust;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
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

/// <summary>
///     Cross-surface execution-mode label invariants (assessment improvement #10).
/// </summary>
[Trait("Suite", "Core")]
public sealed class ExecutionModeCrossSurfaceInvariantTests
{
    public static TheoryData<StructuralExecutionMode, string> PersistedModeLabels =>
        new()
        {
            { StructuralExecutionMode.Simulator, "Simulator" },
            { StructuralExecutionMode.Real, "Real" },
            { StructuralExecutionMode.Fallback, "Fallback" },
            { StructuralExecutionMode.Mixed, "Mixed" },
        };

    [Theory]
    [MemberData(nameof(PersistedModeLabels))]
    public void StructuralExecutionModeLabels_match_buyer_safe_display_names(
        StructuralExecutionMode mode,
        string expectedLabel)
    {
        StructuralExecutionModeLabels.ToDisplayLabel(mode).Should().Be(expectedLabel);
    }

    [Theory]
    [MemberData(nameof(PersistedModeLabels))]
    public async Task First_value_report_and_trust_card_surface_persisted_mode_consistently(
        StructuralExecutionMode mode,
        string expectedLabel)
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(mode, realModeFellBack: mode == StructuralExecutionMode.Fallback);

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        PilotRunDeltas computed = BuildDeltas(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        FirstValueReportBuilder markdownBuilder = CreateFirstValueSut(query.Object, deltas.Object);
        string? markdown = await markdownBuilder.BuildMarkdownAsync("r1", "http://localhost:5000");

        markdown.Should().NotBeNullOrWhiteSpace();
        markdown.Should().Contain(expectedLabel);

        if (mode == StructuralExecutionMode.Fallback)
        {
            markdown.Should().Contain("Real → Simulator (fallback)");
            markdown.Should().Contain("substituted with simulator output");
        }

        RunTrustEvidenceCardBuilder trustBuilder = CreateTrustSut();
        RunTrustEvidenceCard? card = await trustBuilder.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();

        if (mode == StructuralExecutionMode.Fallback)
        {
            card!.ExecutionMode.Detail.Should().Be(StructuralExecutionModeLabels.ToOperatorDetail(StructuralExecutionMode.Fallback));
        }
        else if (mode == StructuralExecutionMode.Mixed)
        {
            card!.ExecutionMode.Detail.Should().Be(StructuralExecutionModeLabels.MixedDetail);
        }
        else if (mode == StructuralExecutionMode.Real)
        {
            card!.ExecutionMode.Detail.Should().Contain("live model path");
        }
        else
        {
            card!.ExecutionMode.Detail.Should().Contain("deterministic analysis path");
        }
    }

    [Fact]
    public void Execution_provenance_footer_never_labels_fallback_as_unqualified_real()
    {
        ExecutionProvenanceFooterRenderer renderer = new();

        string footer = renderer.BuildFooterMarkdown(
            new ExecutionProvenanceFooterInput(
                StructuralExecutionMode.Fallback,
                RealModeFellBackToSimulator: true,
                PilotAoaiDeploymentSnapshot: "gpt-4o-mini",
                HostAgentExecutionMode: "Real",
                HostAzureOpenAiDeploymentName: "gpt-4o-mini",
                LlmCompletionTraceCount: 0));

        footer.Should().Contain("Real → Simulator (fallback)");
        footer.Should().Contain("| Mode | Fallback |");
        footer.Should().NotContain("| Mode | Real |");
    }

    [Fact]
    public void Pilot_run_deltas_response_inherits_demo_and_llm_resolution_flags_without_mode_ambiguity()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(StructuralExecutionMode.Mixed, realModeFellBack: false);
        PilotRunDeltas computed = BuildDeltas(detail) with { IsDemoTenant = true, LlmCallCountResolved = false };

        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            computed,
            CreateEmptySnapshot(),
            extractorCollectionTimestampUtc: null,
            scorecardBaselines: null);

        response.IsDemoTenant.Should().BeTrue();
        response.LlmCallCountResolved.Should().BeFalse();
        StructuralExecutionModeLabels.ToDisplayLabel(detail.Run.StructuralExecutionMode).Should().Be("Mixed");
    }

    private static PilotRunDeltas BuildDeltas(ArchitectureRunDetail detail) =>
        new()
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 1),
            ],
            AuditRowCount = 3,
            LlmCallCount = 2,
            LlmCallCountResolved = true,
            TopFindingId = "top-finding-id",
            TopFindingSeverity = "Warning",
            IsDemoTenant = false,
        };

    private static ArchitectureRunDetail BuildCommittedDetail(
        StructuralExecutionMode mode,
        bool realModeFellBack)
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
            StructuralExecutionMode = mode,
            RealModeFellBackToSimulator = realModeFellBack,
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            Results = [],
            DecisionTraces = [],
        };
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

    private static FirstValueReportBuilder CreateFirstValueSut(
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
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Real" })
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

    private static RunTrustEvidenceCardBuilder CreateTrustSut()
    {
        Mock<IAuditRepository> audit = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IRunExplanationSummaryService> explanation = new();
        Mock<IScopeContextProvider> scope = new();

        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<ArchLucid.Core.Audit.AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        traces.Setup(t => t.GetPagedByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), 0, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));

        return new RunTrustEvidenceCardBuilder(
            audit.Object,
            traces.Object,
            evidence.Object,
            explanation.Object,
            scope.Object);
    }
}
