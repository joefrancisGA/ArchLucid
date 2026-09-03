using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunAgentOutputPilotEvidenceAggregatorTests
{
    [Fact]
    public async Task WouldPilotStrictBlockSponsorEvidenceAsync_ignores_superseded_retry_traces()
    {
        const string runKey = "60606060606060606060606060606060";
        const string taskId = "task-topology-retry";
        DateTime utcNow = new(2026, 8, 21, 12, 0, 0, DateTimeKind.Utc);
        string goodJson = LoadGoldenFixtureWithCitations("golden-agent-result-valid.json");

        AgentOutputQualityGateOptions gateOptions = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0,
            StructuralWarnBelow = 1,
            SemanticWarnBelow = 1,
            PilotStrictMinStructuralCompleteness = 0,
            PilotStrictMinSemanticScore = 0,
            PilotStrictMinEvidenceRefCount = 0,
        };

        AgentExecutionTrace supersededTrace = new()
        {
            TraceId = "trace-superseded",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
            AttemptIndex = 1,
            CreatedUtc = utcNow.AddMinutes(-10),
        };

        AgentExecutionTrace latestTrace = new()
        {
            TraceId = "trace-latest",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
            AttemptIndex = 2,
            CreatedUtc = utcNow,
        };

        RunAgentOutputPilotEvidenceAggregator sut = CreateSut(gateOptions);

        bool blocked = await sut.WouldPilotStrictBlockSponsorEvidenceAsync(
            [supersededTrace, latestTrace],
            explanationSummary: null,
            CancellationToken.None);

        blocked.Should().BeFalse(
            because: "PilotStrict sponsor gating must honor only the latest trace per task after auto-retry");
    }

    [Fact]
    public async Task WouldPilotStrictBlockSponsorEvidenceAsync_blocks_when_calibrated_confidence_below_semantic_reject_floor()
    {
        const string runKey = "70707070707070707070707070707070";
        const string taskId = "task-1";
        string goodJson = LoadGoldenFixtureWithCitations("golden-agent-result-valid.json");

        AgentOutputQualityGateOptions gateOptions = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0.5,
            StructuralWarnBelow = 1,
            SemanticWarnBelow = 1,
            PilotStrictMinStructuralCompleteness = 0,
            PilotStrictMinSemanticScore = 0,
            PilotStrictMinEvidenceRefCount = 0,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0,
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-calibrated-reject",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
        };

        AgentResult agentResult = new()
        {
            ResultId = "result-1",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            CalibratedConfidence = 0.2,
        };

        RunAgentOutputPilotEvidenceAggregator sut = CreateSut(gateOptions, [agentResult]);

        bool blocked = await sut.WouldPilotStrictBlockSponsorEvidenceAsync(
            [trace],
            explanationSummary: null,
            CancellationToken.None);

        blocked.Should().BeTrue(
            because: "PilotStrict sponsor gating must mirror recorder calibrated-confidence semantic reject");
    }

    [Fact]
    public async Task WouldPilotStrictBlockSponsorEvidenceAsync_blocks_when_phase_b_llm_faithfulness_below_reject_floor()
    {
        const string runKey = "80808080808080808080808080808080";
        const string taskId = "task-1";
        string goodJson = LoadGoldenFixtureWithCitations("golden-agent-result-valid.json");

        AgentOutputQualityGateOptions gateOptions = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0,
            StructuralWarnBelow = 1,
            SemanticWarnBelow = 1,
            PilotStrictMinStructuralCompleteness = 0,
            PilotStrictMinSemanticScore = 0,
            PilotStrictMinEvidenceRefCount = 0,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0,
        };

        AgentOutputLlmFaithfulnessOptions faithfulnessOptions = new()
        {
            Enabled = true,
            EnforcePhaseB = true,
            MinScoreRejectBelow = 0.65,
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
            TraceId = "trace-llm-faith-reject",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
        };

        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentEvidencePackage());

        RunAgentOutputPilotEvidenceAggregator sut = CreateSut(
            gateOptions,
            llmFaithfulnessEvaluator: llmFaithfulness.Object,
            llmFaithfulnessOptions: faithfulnessOptions,
            evidencePackage: new AgentEvidencePackage());

        bool blocked = await sut.WouldPilotStrictBlockSponsorEvidenceAsync(
            [trace],
            explanationSummary: null,
            CancellationToken.None);

        blocked.Should().BeTrue(
            because: "PilotStrict sponsor gating must mirror recorder Phase B LLM faithfulness rejection");
    }

    private sealed class NoOpLlmFaithfulnessEvaluator : IAgentOutputFaithfulnessEvaluator
    {
        public Task<double?> TryEvaluateAsync(
            string traceId,
            string parsedResultJson,
            AgentEvidencePackage evidencePackage,
            CancellationToken cancellationToken) =>
            Task.FromResult<double?>(null);
    }

    private static RunAgentOutputPilotEvidenceAggregator CreateSut(
        AgentOutputQualityGateOptions gateOptions,
        IReadOnlyList<AgentResult>? agentResults = null,
        IAgentOutputFaithfulnessEvaluator? llmFaithfulnessEvaluator = null,
        AgentOutputLlmFaithfulnessOptions? llmFaithfulnessOptions = null,
        AgentEvidencePackage? evidencePackage = null)
    {
        Mock<IAgentOutputQualityGateOptionsResolver> optionsResolver = new();
        optionsResolver
            .Setup(r => r.Resolve(It.IsAny<CancellationToken>()))
            .Returns(gateOptions);

        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(evidencePackage);

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
            WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
            ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IAgentResultRepository> agentResultRepository = new();
        agentResultRepository
            .Setup(r => r.GetByRunIdAsync(scope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(agentResults ?? []);

        HeuristicOnlyAgentOutputSemanticEvaluator semanticEvaluator =
            new(new HeuristicAgentOutputSemanticEvaluator());

        return new RunAgentOutputPilotEvidenceAggregator(
            optionsResolver.Object,
            evidenceRepository.Object,
            scopeProvider.Object,
            agentResultRepository.Object,
            new AgentOutputEvaluator(),
            semanticEvaluator,
            new AgentOutputQualityGate(Options.Create(gateOptions)),
            new AgentResultEvidenceFaithfulnessChecker(Options.Create(new AgentFaithfulnessOptions())),
            llmFaithfulnessEvaluator ?? new NoOpLlmFaithfulnessEvaluator(),
            Options.Create(llmFaithfulnessOptions ?? new AgentOutputLlmFaithfulnessOptions()));
    }

    private static string LoadGoldenFixtureWithCitations(string fileName)
    {
        string json = LoadGoldenFixture(fileName).TrimEnd();

        if (json.EndsWith('}'))
            json = json[..^1];

        return json + ",\"citations\":[{\"source\":\"ev-1\"}]}";
    }

    private static string LoadGoldenFixture(string fileName)
    {
        string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "GoldenAgentResults", fileName);

        return File.ReadAllText(path);
    }
}
