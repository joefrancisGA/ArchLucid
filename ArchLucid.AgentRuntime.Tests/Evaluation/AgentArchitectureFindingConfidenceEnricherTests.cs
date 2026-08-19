using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentArchitectureFindingConfidenceEnricherTests
{
    [Fact]
    public async Task TryEnrichRunAsync_matches_trace_by_task_id_when_multiple_topology_tasks_exist()
    {
        const string runId = "run-task-trace-match";
        const string taskPassing = "task-passing";
        const string taskUnparsed = "task-unparsed";
        string goodJson = LoadGoldenFixture("golden-agent-result-valid.json");

        ArchitectureFinding passingFinding = new()
        {
            Category = "Security",
            Message = "Passing task finding with evidence for trace completeness.",
            EvidenceRefs = ["ev-1"],
            SourceAgent = AgentType.Topology,
        };

        ArchitectureFinding unparsedFinding = new()
        {
            Category = "Security",
            Message = "Unparsed task finding with evidence for trace completeness.",
            EvidenceRefs = ["ev-1"],
            SourceAgent = AgentType.Topology,
        };

        AgentResult passingResult = new()
        {
            ResultId = "result-passing",
            TaskId = taskPassing,
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings = [passingFinding],
        };

        AgentResult unparsedResult = new()
        {
            ResultId = "result-unparsed",
            TaskId = taskUnparsed,
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings = [unparsedFinding],
        };

        AgentExecutionTrace passingTrace = new()
        {
            TraceId = "trace-passing",
            TaskId = taskPassing,
            RunId = runId,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
        };

        AgentExecutionTrace unparsedTrace = new()
        {
            TraceId = "trace-unparsed",
            TaskId = taskUnparsed,
            RunId = runId,
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
        };

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
            WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
            ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([passingResult, unparsedResult]);

        resultRepository
            .Setup(r => r.CreateAsync(It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([passingTrace, unparsedTrace]);

        AgentOutputQualityGateOptions gateOptions = new() { Enabled = true };

        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> referenceOptions = new();
        referenceOptions.Setup(o => o.CurrentValue).Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });

        HeuristicOnlyAgentOutputSemanticEvaluator semanticFacade = new(new HeuristicAgentOutputSemanticEvaluator());
        AgentOutputReferenceCaseRunEvaluator referenceEvaluator = new(
            referenceOptions.Object,
            new EmptyReferenceCatalog(),
            new AgentOutputEvaluator(),
            semanticFacade,
            new NoOpAgentOutputEvaluationResultRepository(),
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentArchitectureFindingConfidenceEnricher sut = new(
            resultRepository.Object,
            traceRepository.Object,
            scopeProvider.Object,
            new AgentOutputEvaluator(),
            semanticFacade,
            new AgentOutputQualityGate(Options.Create(gateOptions)),
            Options.Create(gateOptions),
            referenceEvaluator,
            new FindingConfidenceCalculator(),
            NullLogger<AgentArchitectureFindingConfidenceEnricher>.Instance);

        await sut.TryEnrichRunAsync(runId, CancellationToken.None);

        passingFinding.EvaluationConfidenceScore.Should().NotBeNull();
        unparsedFinding.EvaluationConfidenceScore.Should().NotBeNull();
        unparsedFinding.EvaluationConfidenceScore.Should().BeLessThan(passingFinding.EvaluationConfidenceScore!.Value);
        unparsedFinding.EvaluationConfidenceScore.Should().BeLessThan(35);
    }

    private static string LoadGoldenFixture(string fileName)
    {
        string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "GoldenAgentResults", fileName);

        return File.ReadAllText(path);
    }

    private sealed class EmptyReferenceCatalog : IAgentOutputReferenceCaseCatalog
    {
        public IReadOnlyList<AgentOutputReferenceCaseDefinition> Cases { get; } = [];
    }

    private sealed class NoOpAgentOutputEvaluationResultRepository : IAgentOutputEvaluationResultRepository
    {
        public Task AppendAsync(AgentOutputEvaluationResultRecord row, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
