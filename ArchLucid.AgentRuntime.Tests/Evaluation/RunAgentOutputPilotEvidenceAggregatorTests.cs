using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
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

    private static RunAgentOutputPilotEvidenceAggregator CreateSut(AgentOutputQualityGateOptions gateOptions)
    {
        Mock<IAgentOutputQualityGateOptionsResolver> optionsResolver = new();
        optionsResolver
            .Setup(r => r.Resolve(It.IsAny<CancellationToken>()))
            .Returns(gateOptions);

        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);

        HeuristicOnlyAgentOutputSemanticEvaluator semanticEvaluator =
            new(new HeuristicAgentOutputSemanticEvaluator());

        return new RunAgentOutputPilotEvidenceAggregator(
            optionsResolver.Object,
            evidenceRepository.Object,
            new AgentOutputEvaluator(),
            semanticEvaluator,
            new AgentOutputQualityGate(Options.Create(gateOptions)),
            new AgentResultEvidenceFaithfulnessChecker(Options.Create(new AgentFaithfulnessOptions())));
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
