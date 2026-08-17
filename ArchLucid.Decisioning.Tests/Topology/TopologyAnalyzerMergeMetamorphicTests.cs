using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Topology;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologyAnalyzerMergeMetamorphicTests
{
    private readonly TopologyAntiPatternFindingEngine _antiPatternEngine = new();

    [Fact]
    public void No_op_merge_then_analyze_matches_original_structure_gaps()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildComputeWithoutNetworkAnchor();
        IReadOnlyList<string> before = StructureGapCodes(graph);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, []);
        IReadOnlyList<string> after = StructureGapCodes(merged);

        after.Should().BeEquivalentTo(before);
    }

    [Fact]
    public void Gate_rejected_proposals_leave_graph_and_structure_findings_unchanged()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildComputeWithoutNetworkAnchor();
        AgentResult[] rejected =
        [
            BuildRejectedRelationshipResult("reject-0", AgentType.Topology),
            BuildRejectedRelationshipResult("reject-1", AgentType.Cost)
        ];

        IReadOnlyList<string> before = StructureGapCodes(graph);
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, rejected);
        IReadOnlyList<string> after = StructureGapCodes(merged);

        merged.Nodes.Should().HaveCount(graph.Nodes.Count);
        merged.Edges.Should().HaveCount(graph.Edges.Count);
        after.Should().BeEquivalentTo(before);
    }

    [Fact]
    public void Duplicate_topology_service_proposal_merge_is_idempotent_for_structure_findings()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildComputeWithoutNetworkAnchor();
        AgentResult[] proposal = [BuildTopologyServiceProposal("svc-a", "svc-a-name")];

        GraphSnapshot once = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, proposal);
        GraphSnapshot twice = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(once, proposal);

        StructureGapCodes(twice).Should().BeEquivalentTo(StructureGapCodes(once));
    }

    [Fact]
    public void Hub_spoke_fixture_keeps_isolated_datastore_gap_after_no_op_merge()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildHubSpokeWithIsolatedDatastore();
        IReadOnlyList<string> before = AntiPatternGapCodes(graph);

        before.Should().Contain("datastore-without-compute-dependency");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, []);
        IReadOnlyList<string> after = AntiPatternGapCodes(merged);

        after.Should().BeEquivalentTo(before);
    }

    [Fact]
    public void Adding_isolated_compute_does_not_drop_anti_pattern_gap_codes()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildHubSpokeWithIsolatedDatastore();
        IReadOnlyList<string> before = AntiPatternGapCodes(graph);

        GraphSnapshot expanded = TopologyAnalyzerMetamorphicGraphBuilder.AddIsolatedNode(
            graph,
            TopologyAnalyzerMetamorphicGraphBuilder.IsolatedComputeNode("cmp-extra", "worker"));

        IReadOnlyList<string> after = AntiPatternGapCodes(expanded);

        after.Should().Contain(before);
    }

    private static IReadOnlyList<string> StructureGapCodes(GraphSnapshot graph)
    {
        return TopologyStructureAnalyzer.Analyze(graph)
            .Select(static g => g.GapCode)
            .OrderBy(static c => c, StringComparer.Ordinal)
            .ToList();
    }

    private IReadOnlyList<string> AntiPatternGapCodes(GraphSnapshot graph)
    {
        IReadOnlyList<Finding> findings =
            _antiPatternEngine.AnalyzeAsync(graph, CancellationToken.None).GetAwaiter().GetResult();

        return findings
            .Select(ExtractGapCode)
            .Where(static c => c is not null)
            .Select(static c => c!)
            .OrderBy(static c => c, StringComparer.Ordinal)
            .ToList();
    }

    private static string? ExtractGapCode(Finding finding)
    {
        TopologyGapFindingPayload? payload = FindingPayloadConverter.ToTopologyGapPayload(finding);
        return payload?.GapCode;
    }

    private static AgentResult BuildRejectedRelationshipResult(string resultId, AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = resultId,
            TaskId = resultId + "-task",
            RunId = "run-metamorphic",
            AgentType = agentType,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = agentType,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "missing-source",
                        TargetId = "missing-target",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };
    }

    private static AgentResult BuildTopologyServiceProposal(string serviceId, string serviceName)
    {
        return new AgentResult
        {
            ResultId = "topology-1",
            TaskId = "topology-1-task",
            RunId = "run-metamorphic",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = serviceId,
                        ServiceName = serviceName,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };
    }
}
