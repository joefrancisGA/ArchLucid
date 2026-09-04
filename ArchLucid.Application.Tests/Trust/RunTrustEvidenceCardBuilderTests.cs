using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Trust;

[Trait("Suite", "Core")]
public sealed class RunTrustEvidenceCardBuilderTests
{
    [Fact]
    public async Task BuildAsync_WhenNotCommitted_ReturnsNull()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = Guid.NewGuid().ToString("N") },
            Manifest = null,
        };

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().BeNull();
    }

    [Fact]
    public async Task BuildAsync_WhenCommitted_IncludesAuditCountAndLinks()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);

        RunTrustEvidenceCardBuilder sut = CreateSut(
            out Mock<IAuditRepository> audit,
            out Mock<IAgentExecutionTraceRepository> traces);

        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.Is<AuditEventFilter>(f => f.RunId == runGuid),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(12);
        traces.Setup(t => t.CountByRunIdAsync(It.IsAny<ScopeContext>(), detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(44);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card.AuditTrail.Detail.Should().Contain("12");
        card.AgentTraces.Detail.Should().Contain("44");
        card.Links.Should().Contain(l => l.Rel == "traceabilityZip");
        card.TopFinding.Should().NotBeNull();
        card.TopFinding!.FindingId.Should().Be("top-finding");
    }

    [Fact]
    public async Task BuildAsync_uses_persisted_StructuralExecutionMode_for_execution_field()
    {
        Guid runGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);
        detail.Run.StructuralExecutionMode = StructuralExecutionMode.Mixed;

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.ExecutionMode.Detail.Should().Be(StructuralExecutionModeLabels.MixedDetail);
    }

    [Fact]
    public async Task BuildAsync_when_result_findings_null_still_returns_card()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);
        detail.Results =
        [
            new AgentResult
            {
                ResultId = "marker",
                TaskId = "marker",
                RunId = detail.Run.RunId,
                AgentType = AgentType.Compliance,
                Findings = null!,
            },
        ];

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.TopFinding.Should().BeNull();
    }

    [Fact]
    public async Task BuildAsync_when_demo_run_marks_execution_mode_demo_only()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"));
        detail.Run.RunId = ContosoRetailDemoIdentifiers.RunBaseline;

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.ExecutionMode.Status.Should().Be(TrustEvidenceStatusValue.DemoOnly);
    }

    [Fact]
    public async Task BuildAsync_when_fallback_execution_marks_low_confidence()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);
        detail.Run.RealModeFellBackToSimulator = true;

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.ExecutionMode.Status.Should().Be(TrustEvidenceStatusValue.LowConfidence);
    }

    [Fact]
    public async Task BuildAsync_when_run_id_not_guid_throws_conflict()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(Guid.NewGuid());
        detail.Run.RunId = "not-a-guid";

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        Func<Task<RunTrustEvidenceCard?>> act = () => sut.BuildAsync(detail, "Real", CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*run id is not a valid GUID*");
    }

    [Fact]
    public async Task BuildAsync_when_audit_count_throws_marks_low_confidence()
    {
        Guid runGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);

        RunTrustEvidenceCardBuilder sut = CreateSut(out Mock<IAuditRepository> audit, out _);
        audit
            .Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit unavailable"));

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.AuditTrail.Status.Should().Be(TrustEvidenceStatusValue.LowConfidence);
    }

    [Fact]
    public async Task BuildAsync_when_trace_count_throws_marks_traces_missing()
    {
        Guid runGuid = Guid.Parse("11111111-1111-1111-1111-111111111112");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);

        RunTrustEvidenceCardBuilder sut = CreateSut(
            out _,
            out Mock<IAgentExecutionTraceRepository> traces);
        traces
            .Setup(t => t.CountByRunIdAsync(It.IsAny<ScopeContext>(), detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("trace unavailable"));

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.AgentTraces.Status.Should().Be(TrustEvidenceStatusValue.Missing);
    }

    [Fact]
    public async Task BuildAsync_when_explanation_uses_deterministic_fallback_marks_ai_low_confidence()
    {
        Guid runGuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);

        RunTrustEvidenceCardBuilder sut = CreateSut(
            out _,
            out _,
            explanationSummary: new RunExplanationSummary
            {
                Explanation = new ExplanationResult(),
                ThemeSummaries = [],
                OverallAssessment = "ok",
                RiskPosture = "neutral",
                FindingCount = 1,
                DecisionCount = 0,
                UnresolvedIssueCount = 0,
                ComplianceGapCount = 0,
                FaithfulnessSupportRatio = 0.2,
                DeterministicFallbackUsed = true,
                FaithfulnessWarning = null,
                FindingTraceConfidences = [],
            });

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.AiExplainability.Status.Should().Be(TrustEvidenceStatusValue.LowConfidence);
        card.AiExplainability.Detail.Should().Contain("Deterministic narrative fallback");
    }

    [Fact]
    public async Task BuildAsync_when_no_golden_manifest_marks_manifest_missing()
    {
        Guid runGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);
        detail.Run.GoldenManifestId = null;

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.GoldenManifest.Status.Should().Be(TrustEvidenceStatusValue.Missing);
    }

    [Fact]
    public async Task BuildAsync_without_top_finding_omits_evidence_chain_link()
    {
        Guid runGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
        ArchitectureRunDetail detail = BuildCommittedDetail(runGuid);
        detail.Results = [];

        RunTrustEvidenceCardBuilder sut = CreateSut(out _, out _);

        RunTrustEvidenceCard? card = await sut.BuildAsync(detail, "Real", CancellationToken.None);

        card.Should().NotBeNull();
        card!.Links.Should().NotContain(l => l.Rel == "topFindingEvidenceChain");
        card.TopFinding.Should().BeNull();
    }

    private static RunTrustEvidenceCardBuilder CreateSut(
        out Mock<IAuditRepository> audit,
        out Mock<IAgentExecutionTraceRepository> traces,
        RunExplanationSummary? explanationSummary = null)
    {
        audit = new Mock<IAuditRepository>();
        traces = new Mock<IAgentExecutionTraceRepository>();
        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IRunExplanationSummaryService> explanation = new();
        Mock<IScopeContextProvider> scope = new();

        ScopeContext sc = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        scope.Setup(s => s.GetCurrentScope()).Returns(sc);

        evidence.Setup(e => e.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new FindingEvidenceChainResponse
                {
                    RunId = "r1",
                    FindingId = "top-finding",
                    ManifestVersion = "v1",
                    RelatedGraphNodeIds = ["n1"],
                    AgentExecutionTraceIds = ["t1"],
                });

        explanation.Setup(x => x.GetSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                explanationSummary ?? new RunExplanationSummary
                {
                    Explanation = new ExplanationResult(),
                    ThemeSummaries = [],
                    OverallAssessment = "ok",
                    RiskPosture = "neutral",
                    FindingCount = 1,
                    DecisionCount = 0,
                    UnresolvedIssueCount = 0,
                    ComplianceGapCount = 0,
                    FaithfulnessSupportRatio = 0.9,
                    DeterministicFallbackUsed = false,
                    FaithfulnessWarning = null,
                    FindingTraceConfidences =
                    [
                        new FindingTraceConfidenceDto
                        {
                            FindingId = "top-finding",
                            TraceCompletenessRatio = 1,
                            TraceConfidenceLabel = "High",
                            RuleId = "r",
                            EvidenceRefCount = 1,
                            FindingTitle = "Title",
                            MissingTraceFields = [],
                        },
                    ],
                });

        return new RunTrustEvidenceCardBuilder(
            audit.Object,
            traces.Object,
            evidence.Object,
            explanation.Object,
            scope.Object,
            CreateSealedManifestAuthorityMock(sc).Object,
            CreateSealedManifestHashMock());
    }

    private static Mock<IAuthorityQueryService> CreateSealedManifestAuthorityMock(ScopeContext scope)
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
                new RunDetailDto
                {
                    Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                    GoldenManifest = new ManifestDocument
                    {
                        RunId = runId,
                        ManifestHash = "sealed-hash",
                    },
                });

        return authority;
    }

    private static IManifestHashService CreateSealedManifestHashMock()
    {
        Mock<IManifestHashService> manifestHash = new();
        manifestHash.Setup(m => m.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed-hash");

        return manifestHash.Object;
    }

    private static ArchitectureRunDetail BuildCommittedDetail(Guid runGuid)
    {
        DateTime created = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        ArchitectureRun run = new()
        {
            RunId = runGuid.ToString("N"),
            RequestId = "req-test",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = created,
            GoldenManifestId = Guid.NewGuid(),
            ArtifactBundleId = Guid.NewGuid(),
        };

        GoldenManifest manifest = new()
        {
            RunId = run.RunId,
            SystemName = "Sys",
            Metadata = new ManifestMetadata { ManifestVersion = "v9", CreatedUtc = created.AddMinutes(1) },
            Governance = new ManifestGovernance(),
        };

        AgentResult result = new()
        {
            TaskId = "t1",
            RunId = run.RunId,
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding { FindingId = "top-finding", Severity = FindingSeverity.Error, Message = "Problem" },
            ],
        };

        return new ArchitectureRunDetail { Run = run, Manifest = manifest, Results = [result], DecisionTraces = [] };
    }
}
