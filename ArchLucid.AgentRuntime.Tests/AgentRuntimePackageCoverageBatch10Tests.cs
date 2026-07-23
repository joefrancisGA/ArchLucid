using System.Text;

using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch10Tests
{
    [Fact]
    public async Task CompositeAgentOutputSemanticEvaluator_returns_heuristic_when_json_missing()
    {
        AgentOutputSemanticScore heuristicScore = new()
        {
            TraceId = "trace-1",
            AgentType = AgentType.Critic,
            HeuristicOverallScore = 0.72,
            OverallSemanticScore = 0.72,
        };

        Mock<IHeuristicAgentOutputSemanticEvaluator> heuristic = new();
        heuristic
            .Setup(h => h.Evaluate("trace-1", " ", AgentType.Critic))
            .Returns(heuristicScore);

        Mock<IAgentOutputLlmSemanticJudge> judge = new();
        CompositeAgentOutputSemanticEvaluator sut = CreateCompositeEvaluator(heuristic.Object, judge.Object);

        AgentOutputSemanticScore result = await sut.EvaluateAsync("trace-1", " ", AgentType.Critic, CancellationToken.None);

        result.Should().BeSameAs(heuristicScore);
        judge.Verify(
            j => j.TryJudgeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<AgentType>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompositeAgentOutputSemanticEvaluator_blends_judge_score_when_available()
    {
        AgentOutputSemanticScore heuristicScore = new()
        {
            TraceId = "trace-2",
            AgentType = AgentType.Critic,
            HeuristicOverallScore = 0.4,
            OverallSemanticScore = 0.4,
        };

        Mock<IHeuristicAgentOutputSemanticEvaluator> heuristic = new();
        heuristic
            .Setup(h => h.Evaluate("trace-2", """{"claims":[]}""", AgentType.Critic))
            .Returns(heuristicScore);

        Mock<IAgentOutputLlmSemanticJudge> judge = new();
        judge
            .Setup(j => j.TryJudgeAsync("trace-2", """{"claims":[]}""", AgentType.Critic, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentOutputLlmJudgeParsedResult(0.8, "solid", 0.1, 2));

        Mock<IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions>> judgeOptions = new();
        judgeOptions.Setup(o => o.CurrentValue).Returns(new AgentOutputLlmSemanticJudgeOptions { BlendWeight = 0.5 });

        Mock<IOptionsMonitor<AgentOutputQualityGateOptions>> gateOptions = new();
        gateOptions.Setup(o => o.CurrentValue).Returns(new AgentOutputQualityGateOptions());

        CompositeAgentOutputSemanticEvaluator sut = new(
            heuristic.Object,
            judge.Object,
            judgeOptions.Object,
            gateOptions.Object);

        AgentOutputSemanticScore result = await sut.EvaluateAsync(
            "trace-2",
            """{"claims":[]}""",
            AgentType.Critic,
            CancellationToken.None);

        result.OverallSemanticScore.Should().BeApproximately(0.6, 0.001);
        result.LlmJudgeOverallQuality.Should().Be(0.8);
        result.LlmJudgeInvocationCount.Should().Be(2);
        result.LlmJudgeQualityDispersion.Should().Be(0.1);
        result.LlmJudgeHeuristicDisagreement.Should().BeApproximately(0.4, 0.001);
    }

    [Fact]
    public async Task CompositeAgentOutputSemanticEvaluator_elevates_warn_on_material_disagreement()
    {
        AgentOutputSemanticScore heuristicScore = new()
        {
            TraceId = "trace-3",
            AgentType = AgentType.Critic,
            HeuristicOverallScore = 0.5,
            OverallSemanticScore = 0.5,
        };

        Mock<IHeuristicAgentOutputSemanticEvaluator> heuristic = new();
        heuristic
            .Setup(h => h.Evaluate("trace-3", """{"claims":[]}""", AgentType.Critic))
            .Returns(heuristicScore);

        Mock<IAgentOutputLlmSemanticJudge> judge = new();
        judge
            .Setup(j => j.TryJudgeAsync("trace-3", """{"claims":[]}""", AgentType.Critic, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentOutputLlmJudgeParsedResult(0.95, "great"));

        Mock<IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions>> judgeOptions = new();
        judgeOptions.Setup(o => o.CurrentValue).Returns(
            new AgentOutputLlmSemanticJudgeOptions { BlendWeight = 0.5, WarnGateWhenJudgeHeuristicDisagreementAbove = 0.3 });

        Mock<IOptionsMonitor<AgentOutputQualityGateOptions>> gateOptions = new();
        gateOptions.Setup(o => o.CurrentValue).Returns(new AgentOutputQualityGateOptions { SemanticWarnBelow = 0.65 });

        CompositeAgentOutputSemanticEvaluator sut = new(
            heuristic.Object,
            judge.Object,
            judgeOptions.Object,
            gateOptions.Object);

        AgentOutputSemanticScore result = await sut.EvaluateAsync(
            "trace-3",
            """{"claims":[]}""",
            AgentType.Critic,
            CancellationToken.None);

        result.JudgeHeuristicDisagreementElevatesWarn.Should().BeTrue();
    }

    [Fact]
    public async Task HeuristicOnlyAgentOutputSemanticEvaluator_delegates_to_heuristic()
    {
        HeuristicAgentOutputSemanticEvaluator heuristic = new();
        HeuristicOnlyAgentOutputSemanticEvaluator sut = new(heuristic);

        AgentOutputSemanticScore score = await sut.EvaluateAsync(
            "trace-4",
            null,
            AgentType.Topology,
            CancellationToken.None);

        score.TraceId.Should().Be("trace-4");
        score.AgentType.Should().Be(AgentType.Topology);

        Func<Task> blank = () => sut.EvaluateAsync(" ", null, AgentType.Topology, CancellationToken.None);
        await blank.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public void AgentUserPromptBuilder_appends_request_evidence_and_task_sections()
    {
        StringBuilder sb = new();
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Orders",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = "Design a resilient order service with private endpoints.",
            Constraints = ["Use managed identity"],
            RequiredCapabilities = ["messaging"],
            Assumptions = ["Existing SQL estate"],
        };
        AgentEvidencePackage evidence = new()
        {
            EvidencePackageId = "ev-1",
            Policies =
            [
                new PolicyEvidence
                {
                    Title = "SOC2",
                    Summary = "Baseline controls",
                    RequiredControls = ["AC-1"],
                },
            ],
            ServiceCatalog =
            [
                new ServiceCatalogEvidence
                {
                    ServiceName = "Service Bus",
                    Summary = "Async messaging",
                    RecommendedUseCases = ["order-events"],
                },
            ],
            Patterns =
            [
                new PatternEvidence
                {
                    Name = "CQRS",
                    Summary = "Split reads and writes",
                    SuggestedServices = ["cosmos"],
                },
            ],
            PriorManifest = new PriorManifestEvidence
            {
                ManifestVersion = "1",
                Summary = "Prior summary",
                ExistingServices = ["legacy-api"],
            },
        };
        AgentTask task = new()
        {
            Objective = "Review topology risks",
            AllowedTools = ["graph-query"],
            AllowedSources = ["policies"],
        };

        AgentUserPromptBuilder.AppendRunHeader(sb, "run-1", "task-1", "Critic");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        string text = sb.ToString();
        text.Should().Contain("RunId: run-1");
        text.Should().Contain("Architecture Request");
        text.Should().Contain("Evidence Package");
        text.Should().Contain("Policies:");
        text.Should().Contain("Service Catalog Hints:");
        text.Should().Contain("Pattern Hints:");
        text.Should().Contain("Prior Manifest:");
        text.Should().Contain("Task Objective:");
        text.Should().Contain("graph-query");
    }

    private static CompositeAgentOutputSemanticEvaluator CreateCompositeEvaluator(
        IHeuristicAgentOutputSemanticEvaluator heuristic,
        IAgentOutputLlmSemanticJudge judge)
    {
        Mock<IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions>> judgeOptions = new();
        judgeOptions.Setup(o => o.CurrentValue).Returns(new AgentOutputLlmSemanticJudgeOptions());

        Mock<IOptionsMonitor<AgentOutputQualityGateOptions>> gateOptions = new();
        gateOptions.Setup(o => o.CurrentValue).Returns(new AgentOutputQualityGateOptions());

        return new CompositeAgentOutputSemanticEvaluator(
            heuristic,
            judge,
            judgeOptions.Object,
            gateOptions.Object);
    }
}
