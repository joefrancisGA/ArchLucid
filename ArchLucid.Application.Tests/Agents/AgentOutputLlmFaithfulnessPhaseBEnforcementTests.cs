using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputLlmFaithfulnessPhaseBEnforcementTests
{
    private static readonly HeuristicOnlyAgentOutputSemanticEvaluator SemanticShim =
        new(new HeuristicAgentOutputSemanticEvaluator());

    [Fact]
    public async Task TryEvaluateTrace_enforce_phase_b_rejects_unfaithful_trace_without_blocking_other_traces_contract()
    {
        AgentOutputQualityGateOptions gateOptions = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0,
            StructuralWarnBelow = 1,
            SemanticWarnBelow = 1,
            PilotStrictMinEvidenceRefCount = 0,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0
        };

        AgentOutputLlmFaithfulnessOptions faithfulnessOptions = new()
        {
            Enabled = true,
            EnforcePhaseB = true,
            MinScoreRejectBelow = 0.65
        };

        Mock<IAgentOutputFaithfulnessEvaluator> llmFaithfulness = new();
        llmFaithfulness
            .Setup(e => e.TryEvaluateAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<AgentEvidencePackage>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.20);

        AgentExecutionTrace trace = new()
        {
            TraceId = "phase-b-unfaithful",
            RunId = "run-phase-b",
            TaskId = "task-1",
            AgentType = AgentType.Compliance,
            ParseSucceeded = true,
            ParsedResultJson =
                """
                {"resultId":"a","taskId":"b","runId":"c","agentType":3,"claims":[{"text":"x","evidence":"y"}],"evidenceRefs":["e1","e2"],"confidence":0.5,"findings":[{"severity":"High","description":"Long enough description text","recommendation":"Fix it"}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z","citations":[{"source":"stub"}]}
                """
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? result =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                gateOptions,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Microsoft.Extensions.Options.Options.Create(gateOptions)),
                CancellationToken.None,
                new AgentEvidencePackage(),
                llmFaithfulnessEvaluator: llmFaithfulness.Object,
                llmFaithfulnessOptions: faithfulnessOptions);

        result.Should().NotBeNull();
        result!.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Rejected);
        result.EvaluationReason.Should().Contain("llm_faithfulness_below_reject_floor");
    }
}
