using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Compliance;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Compliance;

[Trait("Suite", "Core")]
public sealed class PolicyPackRetrievalPromptFormatterTests
{
    [Fact]
    public void BuildPolicyQueryText_appends_topology_dimension_suffix()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-1",
            SystemName = "EnterpriseRag",
            Environment = "prod",
        };

        string query = PolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request, AgentType.Topology);

        query.Should().StartWith("EnterpriseRag prod");
        query.Should().Contain("reliability");
        query.Should().Contain("performance");
    }

    [Fact]
    public void FormatPolicyPackBlock_uses_cost_objective_for_cost_agent()
    {
        RetrievalCitationFormatter formatter = new();
        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit
            {
                ChunkId = "c1",
                DocumentId = "policy-pack-rule-cost-opt-001",
                CorpusKind = "PolicyPack",
                SourceType = "PolicyPackRule",
                SourceId = "cost-opt-001",
                Title = "Right-size compute",
                Text = "[cost-opt v1.0.0] [Warning] Right-size compute (compute): Avoid oversized SKUs.",
                Score = 0.88,
            },
        ];

        string block = PolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(AgentType.Cost, hits, formatter);

        block.Should().Contain("Cost / FinOps");
        block.Should().Contain("cost and FinOps requirements");
        block.Should().Contain("cost-opt-001");
    }
}
