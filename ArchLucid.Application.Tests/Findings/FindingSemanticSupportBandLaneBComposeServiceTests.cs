using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingSemanticSupportBandLaneBComposeServiceTests
{
    [Fact]
    public async Task ApplyToAgentResultsAsync_does_not_block_when_traces_are_missing()
    {
        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(static repo => repo.GetByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingSemanticSupportBandLaneBComposeService service = new(
            traceRepository.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentResultEvidenceFaithfulnessChecker>());

        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        AgentResult result = new()
        {
            TaskId = "task-1",
            Findings = [finding],
        };

        await service.ApplyToAgentResultsAsync(
            "run-1",
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            [result],
            CancellationToken.None);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public async Task CompareQuality_ApplyToAgentResultsAsync_loads_lane_b_when_trace_run_id_differs_only_by_casing()
    {
        Guid primaryRunId = Guid.Parse("23232323-2323-2323-2323-232323232323");
        string canonicalRunId = primaryRunId.ToString("N");
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-lane-b-casing",
                RunId = legacyUpperRunId,
                TaskId = "task-1",
                AgentType = AgentType.Topology,
                ParseSucceeded = true,
                ParsedResultJson = "{\"findings\":[]}",
            },
            CancellationToken.None);

        InMemoryAgentEvidencePackageRepository evidenceRepository = new();
        await evidenceRepository.CreateAsync(
            new AgentEvidencePackage
            {
                EvidencePackageId = "pkg-lane-b-casing",
                RunId = legacyUpperRunId,
                RequestId = "req-lane-b-casing",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "d" },
            },
            CancellationToken.None);

        Mock<IAgentResultEvidenceFaithfulnessChecker> faithfulnessChecker = new();
        faithfulnessChecker
            .Setup(static checker => checker.Evaluate(It.IsAny<string>(), It.IsAny<AgentEvidencePackage>()))
            .Returns(new AgentResultEvidenceFaithfulnessReport(1, 1, 0, 0, 0.82, []));

        FindingSemanticSupportBandLaneBComposeService service = new(
            traceRepository,
            evidenceRepository,
            faithfulnessChecker.Object);

        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        AgentResult result = new()
        {
            TaskId = "task-1",
            Findings = [finding],
        };

        await service.ApplyToAgentResultsAsync(
            canonicalRunId,
            scope,
            [result],
            CancellationToken.None);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
    }
}
