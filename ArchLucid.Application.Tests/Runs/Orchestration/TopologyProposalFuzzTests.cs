using System.Text;
using System.Text.Json;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
public sealed class TopologyProposalFuzzTests
{
    private static readonly JsonSerializerOptions ProposalJsonOptions = new()
    {
        Converters = { new AgentTopologyProposalJsonConverter() },
    };

    [Fact]
    public void TopologyProposalFuzz_converter_and_merge_do_not_throw_on_seeded_mutations()
    {
        int iterations = int.TryParse(Environment.GetEnvironmentVariable("ARCHLUCID_FUZZ_ITERATIONS"), out int configured)
            ? configured
            : 32;

        Random random = new(20260817);
        byte[] seedCorpus = LoadSeedCorpusBytes();

        for (int iteration = 0; iteration < iterations; iteration++)
        {
            byte[] payload = Mutate(seedCorpus, random);
            string utf8 = Encoding.UTF8.GetString(payload);

            try
            {
                AgentTopologyProposal? proposal =
                    JsonSerializer.Deserialize<AgentTopologyProposal>(utf8, ProposalJsonOptions);

                if (proposal is null)
                    continue;

                GraphSnapshot graph = TinyGraph();
                AgentResult result = new()
                {
                    ResultId = $"fuzz-{iteration}",
                    TaskId = $"fuzz-task-{iteration}",
                    RunId = graph.RunId.ToString("D"),
                    AgentType = AgentType.Topology,
                    ProposedChanges = proposal,
                };

                GraphSnapshot merged =
                    AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [result]);

                GraphMergeInvariantChecker.Check(merged).Should().NotBeNull();
            }
            catch (JsonException)
            {
                // Documented invalid JSON shapes are an expected outcome.
            }
        }
    }

    private static byte[] LoadSeedCorpusBytes()
    {
        string corpusRoot = Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "tests",
            "fuzz",
            "topology-proposal");

        string seedPath = Path.Combine(corpusRoot, "minimal-service-relationship.json");
        return File.Exists(seedPath) ? File.ReadAllBytes(seedPath) : Encoding.UTF8.GetBytes("{}");
    }

    private static byte[] Mutate(byte[] source, Random random)
    {
        byte[] copy = source.ToArray();
        int mutationCount = random.Next(1, 6);

        for (int mutation = 0; mutation < mutationCount; mutation++)
        {
            int index = random.Next(copy.Length);
            copy[index] = (byte)random.Next(256);
        }

        return copy;
    }

    private static GraphSnapshot TinyGraph()
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "a",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "a",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Inventory",
                    SourceId = "a",
                },
                new GraphNode
                {
                    NodeId = "b",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "b",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Inventory",
                    SourceId = "b",
                }
            ],
            Edges = [],
            Warnings = [],
        };
    }
}
