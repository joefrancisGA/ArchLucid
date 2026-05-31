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
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;

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
        traces.Setup(t => t.GetPagedByRunIdAsync(detail.Run.RunId, 0, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 44));

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

    private static RunTrustEvidenceCardBuilder CreateSut(
        out Mock<IAuditRepository> audit,
        out Mock<IAgentExecutionTraceRepository> traces)
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
                new RunExplanationSummary
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
            scope.Object);
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
