using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RunDetailDecisionExplainabilityEnrichmentSliceTests
{
    [Fact]
    public async Task CompareQuality_EnrichAsync_loads_coordinator_nodes_when_stored_run_id_differs_only_by_casing()
    {
        Guid runGuid = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2");
        string runN = runGuid.ToString("N");

        InMemoryDecisionNodeRepository decisionNodes = new();
        await decisionNodes.CreateManyAsync(
            [
                new DecisionNodeRecord
                {
                    RunId = runN.ToUpperInvariant(),
                    Topic = "TopologyAcceptance",
                    Rationale = "Coordinator retained topology.",
                    Confidence = 0.8,
                },
            ],
            CancellationToken.None);

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runGuid },
        };

        RunDetailDecisionExplainabilityEnrichmentSlice slice = new(decisionNodes);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.DecisionExplainability.Should().NotBeNull();
        detail.DecisionExplainability!.CoordinatorDecisionNodes.Should().ContainSingle();
        detail.DecisionExplainability.CoordinatorDecisionNodes[0].Topic.Should().Be("TopologyAcceptance");
    }
}
