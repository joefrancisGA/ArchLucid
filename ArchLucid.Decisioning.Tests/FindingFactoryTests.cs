using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Finding Factory.
/// </summary>
[Trait("Category", "Unit")]
public sealed class FindingFactoryTests
{
    [Fact]
    public void CreateRequirementFinding_SetsSchemaVersionAndPayloadType()
    {
        Finding f = FindingFactory.CreateRequirementFinding(
            "requirement", "t", "r", "N", "text", true);

        f.FindingSchemaVersion.Should().Be(FindingsSchema.CurrentFindingVersion);
        f.PayloadType.Should().Be(nameof(RequirementFindingPayload));
        f.Category.Should().Be("Requirement");
    }

    [Fact]
    public void CreateTopologyGapFinding_PopulatesExplainabilityTrace()
    {
        Finding f = FindingFactory.CreateTopologyGapFinding(
            "topology-gap-engine",
            "Gap title",
            "Rationale",
            gapCode: "missing-edge",
            description: "No path between subnets",
            impact: "high",
            relatedNodeIds: ["n1", "n2"]);

        f.Trace.GraphNodeIdsExamined.Should().Equal("n1", "n2");
        f.Trace.RulesApplied.Should().Contain("topology-gap-missing-edge");
        f.Trace.DecisionsTaken.Should().ContainSingle()
            .Which.Should().Be("Detected topology gap: No path between subnets");
        f.Trace.AlternativePathsConsidered.Should().ContainSingle()
            .Which.Should().Be(ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote);
    }

    [Fact]
    public void CreatePolicyApplicabilityFinding_maps_payload_and_trace()
    {
        GraphNode policy = new()
        {
            NodeId = "policy-1",
            NodeType = GraphNodeTypes.PolicyControl,
            Label = "Encrypt data at rest"
        };

        Finding f = FindingFactory.CreatePolicyApplicabilityFinding(
            "policy-engine",
            policy,
            policyReference: "ref-42",
            applicableTopologyNodeIds: ["topo-a"],
            graphNodeIdsExamined: ["policy-1", "topo-a", "policy-1"]);

        f.PayloadType.Should().Be(nameof(PolicyApplicabilityFindingPayload));

        PolicyApplicabilityFindingPayload p = (PolicyApplicabilityFindingPayload)f.Payload!;
        p.PolicyName.Should().Be(policy.Label);
        p.PolicyReference.Should().Be("ref-42");
        p.ApplicableTopologyResourceCount.Should().Be(1);
        p.ApplicableTopologyNodeIds.Should().Equal("topo-a");
        f.RelatedNodeIds.Should().Equal("policy-1", "topo-a");
    }

    [Fact]
    public void CreatePolicyApplicabilityGapFinding_warns_when_no_topology_targets()
    {
        GraphNode policy = new()
        {
            NodeId = "policy-orphan",
            NodeType = GraphNodeTypes.PolicyControl,
            Label = "Isolated policy"
        };

        Finding f = FindingFactory.CreatePolicyApplicabilityGapFinding(
            "policy-gap-engine",
            policy,
            "pkg-iso",
            "No applicability edges.");

        f.Severity.Should().Be(FindingSeverity.Warning);

        PolicyApplicabilityFindingPayload p = (PolicyApplicabilityFindingPayload)f.Payload!;
        p.ApplicableTopologyResourceCount.Should().Be(0);
        p.ApplicableTopologyNodeIds.Should().BeEmpty();
        f.Trace.Notes.Should().ContainSingle(n => n.Contains("Isolated policy", StringComparison.Ordinal));
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_throws_when_finding_null()
    {
        AgentResult agent = new();

        Action act = () => FindingFactory.CreateFromAgentArchitectureFinding(null!, agent);

        act.Should().Throw<ArgumentNullException>().WithParameterName("finding");
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_throws_when_agent_result_null()
    {
        ArchitectureFinding finding = new() { Message = "m" };

        Action act = () => FindingFactory.CreateFromAgentArchitectureFinding(finding, null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("agentResult");
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_truncates_title_and_maps_trace_notes()
    {
        string suffix = new('x', 520);
        ArchitectureFinding finding = new()
        {
            FindingId = "short-id-for-trace-path",
            Message = new string('m', 50) + suffix,
            Category = "",
            ConfidenceScore = 0.71,
            EvaluationConfidenceScore = 88,
            EvidenceRefs = ["e1", "e2"],
        };

        AgentResult agent = new()
        {
            AgentType = AgentType.Compliance,
            Confidence = 0.41
        };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(finding, agent);

        mapped.Title.Should().HaveLength(500);

        mapped.Category.Should().Be(AgentType.Compliance.ToString());
        mapped.ConfidenceScore.Should().BeApproximately(0.71, 0.0001);
        mapped.EvaluationConfidenceScore.Should().Be(88);
        mapped.AgentExecutionTraceId.Should().Be(finding.FindingId);
        mapped.Trace!.Notes.Should().Contain("evidence:e1").And.Contain("evidence:e2");
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_copies_bounded_reasoning_trace()
    {
        ArchitectureFinding finding = new() { Message = "Risk", Category = "sec" };

        AgentResult agent = new()
        {
            AgentType = AgentType.Compliance,
            ReasoningTrace = "Model considered PHI boundary controls.",
        };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(finding, agent);

        mapped.Trace!.ReasoningTrace.Should().Be("Model considered PHI boundary controls.");
        mapped.Trace.ReasoningTraceDigestSha256.Should().BeNull();
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_truncates_reasoning_and_sets_digest()
    {
        ArchitectureFinding finding = new() { Message = "Risk", Category = "sec" };

        string longReasoning = new('x', ReasoningTraceBounds.MaxStoredCharacters + 10);
        AgentResult agent = new() { AgentType = AgentType.Topology, ReasoningTrace = longReasoning };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(finding, agent);

        mapped.Trace!.ReasoningTrace.Should().HaveLength(ReasoningTraceBounds.MaxStoredCharacters);
        mapped.Trace.ReasoningTraceDigestSha256.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void CreateFromAgentArchitectureFinding_truncates_execution_trace_when_trace_id_long()
    {
        ArchitectureFinding finding = new() { Message = "Risk", Category = "sec" };

        AgentResult agent = new() { AgentType = AgentType.Topology };

        AgentExecutionTrace trace = new()
        {
            TraceId = new string('z', 40),
            ModelDeploymentName = "gpt-test"
        };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(finding, agent, trace);

        mapped.AgentExecutionTraceId.Should().HaveLength(32).And.Be(new string('z', 32));
        mapped.ModelDeploymentName.Should().Be("gpt-test");
    }
}

