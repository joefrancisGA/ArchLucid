using ArchLucid.AgentRuntime.Evaluation;

using FluentAssertions;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentOutputReferenceCaseRunEvaluatorTests
{
    [SkippableFact]
    public async Task EvaluateTraceAsync_when_enabled_appends_row_for_matching_agent_type()
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new AgentExecutionReferenceEvaluationOptions { Enabled = true });

        const string parsedJson = """
                                  {"resultId":"r1","taskId":"t1","runId":"run-1","agentType":"Topology","claims":[],"evidenceRefs":[],"confidence":0.5,"findings":[]}
                                  """;

        IReadOnlyList<AgentOutputReferenceCaseDefinition> cases =
        [
            new() { CaseId = "case-a", AgentType = AgentType.Topology }
        ];

        FixedCatalog catalog = new(cases);
        Mock<IAgentOutputEvaluationResultRepository> results = new();
        results
            .Setup(r => r.AppendAsync(It.IsAny<AgentOutputEvaluationResultRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        HeuristicOnlyAgentOutputSemanticEvaluator facade = new(new HeuristicAgentOutputSemanticEvaluator());
        AgentOutputReferenceCaseRunEvaluator sut = new(
            options.Object,
            catalog,
            new AgentOutputEvaluator(),
            facade,
            results.Object,
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentExecutionTrace trace = new()
        {
            TraceId = "tr1",
            RunId = "run-1",
            TaskId = "t1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = parsedJson
        };

        await sut.EvaluateTraceAsync(trace, "run-1", CancellationToken.None);

        results.Verify(
            r => r.AppendAsync(
                It.Is<AgentOutputEvaluationResultRecord>(row =>
                    row.CaseId == "case-a"
                    && row.TraceId == "tr1"
                    && row.RunId == "run-1"
                    && row.AgentType == AgentType.Topology),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task EvaluateTraceAsync_when_disabled_does_not_append()
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new AgentExecutionReferenceEvaluationOptions { Enabled = false });

        FixedCatalog catalog =
            new([new AgentOutputReferenceCaseDefinition { CaseId = "x", AgentType = AgentType.Topology }]);
        Mock<IAgentOutputEvaluationResultRepository> results = new();
        HeuristicOnlyAgentOutputSemanticEvaluator facade = new(new HeuristicAgentOutputSemanticEvaluator());
        AgentOutputReferenceCaseRunEvaluator sut = new(
            options.Object,
            catalog,
            new AgentOutputEvaluator(),
            facade,
            results.Object,
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentExecutionTrace trace = new()
        {
            TraceId = "tr1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{}"
        };

        await sut.EvaluateTraceAsync(trace, "run-1", CancellationToken.None);

        results.Verify(
            r => r.AppendAsync(It.IsAny<AgentOutputEvaluationResultRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ComputeAnyPassingReferenceCase_returns_false_when_composite_semantic_below_minimum()
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new AgentExecutionReferenceEvaluationOptions { Enabled = true });

        const string parsedJson = """
                                  {"resultId":"r1","taskId":"t1","runId":"run-1","agentType":"Topology","claims":[],"evidenceRefs":[],"confidence":0.5,"findings":[]}
                                  """;

        IReadOnlyList<AgentOutputReferenceCaseDefinition> cases =
        [
            new()
            {
                CaseId = "high-semantic-bar",
                AgentType = AgentType.Topology,
                MinimumSemanticScore = 0.9,
            },
        ];

        Mock<IAgentOutputSemanticEvaluator> semantic = new();
        semantic
            .Setup(s => s.EvaluateAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<AgentType>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentOutputSemanticScore
            {
                TraceId = "tr1",
                AgentType = AgentType.Topology,
                OverallSemanticScore = 0.2,
                HeuristicOverallScore = 0.95,
            });

        AgentOutputReferenceCaseRunEvaluator sut = new(
            options.Object,
            new FixedCatalog(cases),
            new AgentOutputEvaluator(),
            semantic.Object,
            Mock.Of<IAgentOutputEvaluationResultRepository>(),
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentExecutionTrace trace = new()
        {
            TraceId = "tr1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = parsedJson,
        };

        bool passing = await sut.ComputeAnyPassingReferenceCaseAsync(trace, CancellationToken.None);

        passing.Should().BeFalse();
    }

    private sealed class FixedCatalog(IReadOnlyList<AgentOutputReferenceCaseDefinition> cases)
        : IAgentOutputReferenceCaseCatalog
    {
        public IReadOnlyList<AgentOutputReferenceCaseDefinition> Cases
        {
            get;
        } = cases;
    }
}
