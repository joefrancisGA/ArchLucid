using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Decisions;
using ArchiForge.DecisionEngine.Services;
using FluentAssertions;

namespace ArchiForge.DecisionEngine.Tests;

public sealed class DecisionEngineV2Tests
{
    private readonly DecisionEngineV2 _engine = new();

    [Fact]
    public async Task ResolveAsync_WhenSingleProposal_SelectsInclude()
    {
        var results = new List<AgentResult>
        {
            new()
            {
                RunId = "RUN-1",
                AgentType = AgentType.Topology,
                Confidence = 0.8,
                EvidenceRefs = ["req"],
                ProposedChanges = new ManifestDeltaProposal
                {
                    SourceAgent = AgentType.Topology,
                    AddedDatastores =
                    [
                        new() { DatastoreName = "redis" }
                    ]
                }
            }
        };

        var decisions = await _engine.ResolveAsync(
            "RUN-1",
            results,
            evaluations: [],
            new AgentEvidencePackage { RunId = "RUN-1", RequestId = "REQ-1", SystemName = "S" });

        var node = decisions.Single(d => d.Topic == "Datastore:redis");
        node.Options.Should().HaveCount(2);
        node.SelectedOptionId.Should().Be(node.Options.Single(o => o.Description == "Include").OptionId);
    }

    [Fact]
    public async Task ResolveAsync_WhenOpposed_SelectsExclude()
    {
        var results = new List<AgentResult>
        {
            new()
            {
                RunId = "RUN-1",
                AgentType = AgentType.Topology,
                Confidence = 0.6,
                ProposedChanges = new ManifestDeltaProposal
                {
                    SourceAgent = AgentType.Topology,
                    AddedDatastores =
                    [
                        new() { DatastoreName = "redis" }
                    ]
                }
            }
        };

        var evals = new List<AgentEvaluation>
        {
            new()
            {
                Topic = "Datastore:redis",
                OptionDescription = "Include",
                EvaluationType = "oppose",
                ConfidenceDelta = -1.0
            }
        };

        var decisions = await _engine.ResolveAsync(
            "RUN-1",
            results,
            evals,
            new AgentEvidencePackage { RunId = "RUN-1", RequestId = "REQ-1", SystemName = "S" });

        var node = decisions.Single(d => d.Topic == "Datastore:redis");
        node.SelectedOptionId.Should().Be(node.Options.Single(o => o.Description == "Exclude").OptionId);
        node.OpposingEvaluationIds.Should().Contain(evals[0].EvaluationId);
    }
}

