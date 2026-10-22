using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Provenance.Tests;

[Trait("Category", "Unit")]
public sealed class ProvenanceSnapshotRevisionHasherTests
{
    private static readonly Guid RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid BundleId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ContextSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public void Compute_changes_when_manifest_context_snapshot_id_differs_but_manifest_id_hash_and_decisions_are_unchanged()
    {
        ProvenanceBuildInput baseline = CreateInput([]);
        ProvenanceBuildInput updated = CreateInput([]);
        baseline.Manifest.ContextSnapshotId = ContextSnapshotId;
        updated.Manifest.ContextSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_findings_context_snapshot_id_differs_but_findings_snapshot_id_and_payload_are_unchanged()
    {
        Finding finding = CreateSampleFinding();

        ProvenanceBuildInput baseline = CreateInput([], findings: [finding]);
        ProvenanceBuildInput updated = CreateInput([], findings: [finding]);
        baseline.Findings.ContextSnapshotId = ContextSnapshotId;
        updated.Findings.ContextSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_manifest_graph_snapshot_id_differs_but_manifest_id_hash_and_graph_topology_are_unchanged()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };
        Guid graphSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [node]);
        baseline.Manifest.GraphSnapshotId = graphSnapshotId;
        updated.Manifest.GraphSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        baseline.Graph.GraphSnapshotId = graphSnapshotId;
        updated.Graph.GraphSnapshotId = graphSnapshotId;

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_manifest_findings_snapshot_id_differs_but_manifest_id_hash_and_findings_payload_are_unchanged()
    {
        Finding finding = CreateSampleFinding();

        ProvenanceBuildInput baseline = CreateInput([], findings: [finding]);
        ProvenanceBuildInput updated = CreateInput([], findings: [finding]);
        Guid findingsSnapshotId = baseline.Findings.FindingsSnapshotId;
        baseline.Manifest.FindingsSnapshotId = findingsSnapshotId;
        updated.Manifest.FindingsSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_context_snapshot_id_differs_but_graph_snapshot_id_and_nodes_are_unchanged()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };
        Guid graphSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [node]);
        baseline.Graph.GraphSnapshotId = graphSnapshotId;
        updated.Graph.GraphSnapshotId = graphSnapshotId;
        baseline.Graph.ContextSnapshotId = ContextSnapshotId;
        updated.Graph.ContextSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_findings_header_graph_snapshot_id_differs_but_graph_snapshot_id_and_nodes_are_unchanged()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };
        Guid graphSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [node]);
        baseline.Findings.GraphSnapshotId = graphSnapshotId;
        updated.Findings.GraphSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        baseline.Graph.GraphSnapshotId = graphSnapshotId;
        updated.Graph.GraphSnapshotId = graphSnapshotId;

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_duplicate_parallel_graph_edge_is_removed()
    {
        GraphEdge edge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
        };

        GraphEdge duplicateEdge = new()
        {
            EdgeId = "edge-2",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
        };

        ProvenanceBuildInput withDuplicate = CreateInput([], graphEdges: [edge, duplicateEdge]);
        ProvenanceBuildInput withSingle = CreateInput([], graphEdges: [edge]);

        ProvenanceSnapshotRevisionHasher.Compute(withDuplicate, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(withSingle, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_graph_schema_version_changes()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [node]);
        baseline.Graph.SchemaVersion = 1;
        updated.Graph.SchemaVersion = 2;

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_manifest_hash_differs_only_by_surrounding_whitespace()
    {
        ProvenanceBuildInput baseline = CreateInput([], manifestHash: "manifest-hash-v1");
        ProvenanceBuildInput updated = CreateInput([], manifestHash: "  manifest-hash-v1  ");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_artifact_content_hash_differs_only_by_surrounding_whitespace()
    {
        Guid artifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        SynthesizedArtifact baseline = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        SynthesizedArtifact updated = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "  hash-v1  ",
        };

        ProvenanceSnapshotRevisionHasher.Compute(CreateInput([baseline]), BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(CreateInput([updated]), BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_rule_audit_trace_tenant_id_changes()
    {
        ProvenanceBuildInput baseline = CreateInput([], ["rule-a"]);
        ProvenanceBuildInput updated = CreateInput([], ["rule-a"]);

        RuleAuditTraceDto baselineTrace = (RuleAuditTraceDto)baseline.DecisionTrace;
        RuleAuditTraceDto updatedTrace = (RuleAuditTraceDto)updated.DecisionTrace;
        baselineTrace.RuleAudit.TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        updatedTrace.RuleAudit.TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_rule_audit_trace_run_id_differs_but_decision_trace_id_and_applied_rules_are_unchanged()
    {
        ProvenanceBuildInput baseline = CreateInput([], ["rule-a"]);
        ProvenanceBuildInput updated = CreateInput([], ["rule-a"]);

        RuleAuditTraceDto baselineTrace = (RuleAuditTraceDto)baseline.DecisionTrace;
        RuleAuditTraceDto updatedTrace = (RuleAuditTraceDto)updated.DecisionTrace;
        baselineTrace.RuleAudit.RunId = RunId;
        updatedTrace.RuleAudit.RunId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_snapshot_run_id_differs_but_graph_snapshot_id_and_nodes_are_unchanged()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [node]);
        updated.Graph.RunId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_finding_engine_type_changes()
    {
        Finding baselineFinding = CreateSampleFinding();
        Finding updatedFinding = CreateSampleFinding();
        baselineFinding.EngineType = "compliance";
        updatedFinding.EngineType = "cost";

        ProvenanceSnapshotRevisionHasher.Compute(CreateInput([], findings: [baselineFinding]), BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(CreateInput([], findings: [updatedFinding]), BundleId));
    }

    [Fact]
    public void Compute_changes_when_findings_snapshot_run_id_differs_but_findings_snapshot_id_and_payload_are_unchanged()
    {
        ProvenanceBuildInput baseline = CreateInput([], findings: [CreateSampleFinding()]);
        ProvenanceBuildInput updated = CreateInput([], findings: [CreateSampleFinding()]);
        updated.Findings.RunId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_finding_severity_changes()
    {
        Finding baselineFinding = CreateSampleFinding();
        Finding updatedFinding = CreateSampleFinding();
        baselineFinding.Severity = FindingSeverity.Warning;
        updatedFinding.Severity = FindingSeverity.Critical;

        ProvenanceSnapshotRevisionHasher.Compute(CreateInput([], findings: [baselineFinding]), BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(CreateInput([], findings: [updatedFinding]), BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_edge_is_added_but_node_fingerprint_is_unchanged()
    {
        GraphNode node = new() { NodeId = "node-a", NodeType = "Resource", Label = "A" };
        GraphEdge edge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
        };

        ProvenanceBuildInput withoutEdge = CreateInput([], graphNodes: [node]);
        ProvenanceBuildInput withEdge = CreateInput([], graphNodes: [node], graphEdges: [edge]);

        ProvenanceSnapshotRevisionHasher.Compute(withoutEdge, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(withEdge, BundleId));
    }

    [Fact]
    public void Compute_changes_when_manifest_hash_changes_but_manifest_id_is_unchanged()
    {
        ProvenanceBuildInput baseline = CreateInput([]);
        ProvenanceBuildInput updated = CreateInput([]);
        updated.Manifest.ManifestHash = "hash-v2";

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_rule_set_hash_changes()
    {
        ProvenanceBuildInput baseline = CreateInput([], ["rule-a"]);
        ProvenanceBuildInput updated = CreateInput([], ["rule-a"]);

        RuleAuditTraceDto baselineTrace = (RuleAuditTraceDto)baseline.DecisionTrace;
        RuleAuditTraceDto updatedTrace = (RuleAuditTraceDto)updated.DecisionTrace;
        baselineTrace.RuleAudit.RuleSetHash = "rules-v1";
        updatedTrace.RuleAudit.RuleSetHash = "rules-v2";

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_applied_rule_ids_change_but_decision_trace_id_is_unchanged()
    {
        ProvenanceBuildInput baseline = CreateInput([], ["rule-a"]);
        ProvenanceBuildInput updated = CreateInput([], ["rule-a", "rule-b"]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_node_type_changes_but_node_id_and_label_are_unchanged()
    {
        GraphNode baselineNode = new()
        {
            NodeId = "node-a",
            NodeType = "Resource",
            Label = "Workload",
            Category = "compute",
        };

        GraphNode updatedNode = new()
        {
            NodeId = "node-a",
            NodeType = "Service",
            Label = "Workload",
            Category = "compute",
        };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [baselineNode]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [updatedNode]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_node_label_changes_but_graph_snapshot_id_and_node_ids_are_unchanged()
    {
        GraphNode baselineNode = new() { NodeId = "node-a", NodeType = "Resource", Label = "Original label" };
        GraphNode updatedNode = new() { NodeId = "node-a", NodeType = "Resource", Label = "Renamed label" };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [baselineNode]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [updatedNode]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_nodes_change_but_graph_snapshot_id_is_unchanged()
    {
        GraphNode baselineNode = new() { NodeId = "node-a", NodeType = "Resource" };
        GraphNode addedNode = new() { NodeId = "node-b", NodeType = "Resource" };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [baselineNode]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [baselineNode, addedNode]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_supporting_finding_ids_change_but_manifest_hash_is_unchanged()
    {
        ResolvedArchitectureDecision baselineDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Decision",
            SelectedOption = "a",
            Rationale = "r",
            SupportingFindingIds = ["find-a"],
        };

        ResolvedArchitectureDecision updatedDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Decision",
            SelectedOption = "a",
            Rationale = "r",
            SupportingFindingIds = ["find-a", "find-b"],
        };

        ProvenanceBuildInput baseline = CreateInput([], manifestHash: "stale-hash", decisions: [baselineDecision]);
        ProvenanceBuildInput updated = CreateInput([], manifestHash: "stale-hash", decisions: [updatedDecision]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_manifest_decision_title_changes_but_manifest_id_and_supporting_findings_are_unchanged()
    {
        ResolvedArchitectureDecision baselineDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Original decision title",
            SelectedOption = "a",
            Rationale = "r",
            SupportingFindingIds = ["find-a"],
        };

        ResolvedArchitectureDecision updatedDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Renamed decision title",
            SelectedOption = "a",
            Rationale = "r",
            SupportingFindingIds = ["find-a"],
        };

        ProvenanceBuildInput baseline = CreateInput([], manifestHash: "stale-hash", decisions: [baselineDecision]);
        ProvenanceBuildInput updated = CreateInput([], manifestHash: "stale-hash", decisions: [updatedDecision]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_graph_edge_label_changes()
    {
        GraphEdge baselineEdge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
            Label = "Original edge label",
        };

        GraphEdge updatedEdge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
            Label = "Renamed edge label",
        };

        ProvenanceBuildInput baseline = CreateInput([], graphNodes: [], graphEdges: [baselineEdge]);
        ProvenanceBuildInput updated = CreateInput([], graphNodes: [], graphEdges: [updatedEdge]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_agent_execution_trace_id_changes_but_finding_id_and_related_nodes_are_unchanged()
    {
        Finding baselineFinding = CreateSampleFinding();
        Finding updatedFinding = CreateSampleFinding();
        baselineFinding.AgentExecutionTraceId = "trace-v1";
        updatedFinding.AgentExecutionTraceId = "trace-v2";

        ProvenanceBuildInput baseline = CreateInput([], findings: [baselineFinding]);
        ProvenanceBuildInput updated = CreateInput([], findings: [updatedFinding]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_finding_title_changes_but_finding_id_and_related_nodes_are_unchanged()
    {
        Finding baselineFinding = new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "sec",
            EngineType = "compliance",
            Severity = FindingSeverity.Warning,
            Title = "Original title",
            Rationale = "r",
            RelatedNodeIds = ["node-a"],
        };

        Finding updatedFinding = new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "sec",
            EngineType = "compliance",
            Severity = FindingSeverity.Warning,
            Title = "Renamed title",
            Rationale = "r",
            RelatedNodeIds = ["node-a"],
        };

        ProvenanceBuildInput baseline = CreateInput([], findings: [baselineFinding]);
        ProvenanceBuildInput updated = CreateInput([], findings: [updatedFinding]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_findings_generation_status_changes()
    {
        ProvenanceBuildInput baseline = CreateInput([], findings: [CreateSampleFinding()]);
        ProvenanceBuildInput updated = CreateInput([], findings: [CreateSampleFinding()]);
        baseline.Findings.GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete;
        updated.Findings.GenerationStatus = FindingsSnapshotGenerationStatus.Complete;

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_rule_set_id_and_version_change()
    {
        ProvenanceBuildInput baseline = CreateInput([], ["rule-a"]);
        ProvenanceBuildInput updated = CreateInput([], ["rule-a"]);

        RuleAuditTraceDto baselineTrace = (RuleAuditTraceDto)baseline.DecisionTrace;
        RuleAuditTraceDto updatedTrace = (RuleAuditTraceDto)updated.DecisionTrace;
        baselineTrace.RuleAudit.RuleSetId = "ruleset-v1";
        baselineTrace.RuleAudit.RuleSetVersion = "1.0.0";
        updatedTrace.RuleAudit.RuleSetId = "ruleset-v2";
        updatedTrace.RuleAudit.RuleSetVersion = "2.0.0";

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_finding_related_node_ids_change_but_findings_snapshot_id_is_unchanged()
    {
        Finding baselineFinding = new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "sec",
            EngineType = "compliance",
            Severity = FindingSeverity.Warning,
            Title = "Finding",
            Rationale = "r",
            RelatedNodeIds = ["node-a"],
        };

        Finding updatedFinding = new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "sec",
            EngineType = "compliance",
            Severity = FindingSeverity.Warning,
            Title = "Finding",
            Rationale = "r",
            RelatedNodeIds = ["node-b"],
        };

        ProvenanceBuildInput baseline = CreateInput([], findings: [baselineFinding]);
        ProvenanceBuildInput updated = CreateInput([], findings: [updatedFinding]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_artifact_name_changes_but_artifact_id_and_content_hash_are_unchanged()
    {
        Guid artifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        SynthesizedArtifact baseline = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview-v1.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        SynthesizedArtifact updated = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview-v2.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        ProvenanceSnapshotRevisionHasher.Compute(CreateInput([baseline]), BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(CreateInput([updated]), BundleId));
    }

    [Fact]
    public void Compute_unchanged_when_only_manifest_decision_selected_option_changes()
    {
        ResolvedArchitectureDecision baselineDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Decision",
            SelectedOption = "option-a",
            Rationale = "r",
            SupportingFindingIds = ["find-a"],
        };

        ResolvedArchitectureDecision updatedDecision = new()
        {
            DecisionId = "dec-1",
            Category = "arch",
            Title = "Decision",
            SelectedOption = "option-b",
            Rationale = "different rationale",
            SupportingFindingIds = ["find-a"],
        };

        ProvenanceBuildInput baseline = CreateInput([], manifestHash: "stale-hash", decisions: [baselineDecision]);
        ProvenanceBuildInput updated = CreateInput([], manifestHash: "stale-hash", decisions: [updatedDecision]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_graph_edge_type_changes_but_endpoints_are_unchanged()
    {
        GraphEdge baselineEdge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
        };

        GraphEdge updatedEdge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "Contains",
        };

        ProvenanceBuildInput baseline = CreateInput([], graphEdges: [baselineEdge]);
        ProvenanceBuildInput updated = CreateInput([], graphEdges: [updatedEdge]);

        ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId));
    }

    [Fact]
    public void Compute_changes_when_contributing_decision_ids_change_but_content_hash_is_unchanged()
    {
        Guid artifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        SynthesizedArtifact baseline = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
            ContributingDecisionIds = ["dec-a"],
        };

        SynthesizedArtifact updated = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
            ContributingDecisionIds = ["dec-a", "dec-b"],
        };

        ProvenanceSnapshotRevisionHasher.Compute(CreateInput([baseline]), BundleId)
            .Should().NotBe(ProvenanceSnapshotRevisionHasher.Compute(CreateInput([updated]), BundleId));
    }

    [Fact]
    public void Compute_changes_when_artifact_content_hash_changes()
    {
        ProvenanceBuildInput baseline = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
        ]);

        ProvenanceBuildInput updated = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v2",
                ContentHash = "hash-v2",
            },
        ]);

        string baselineHash = ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId);
        string updatedHash = ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId);

        updatedHash.Should().NotBe(baselineHash);
    }

    [Fact]
    public void Compute_changes_when_artifact_is_added()
    {
        ProvenanceBuildInput withoutSecond = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
        ]);

        ProvenanceBuildInput withSecond = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                ArtifactType = "diagram",
                Name = "topology.mmd",
                Format = "mmd",
                Content = "graph",
                ContentHash = "hash-diagram",
            },
        ]);

        string withoutSecondHash = ProvenanceSnapshotRevisionHasher.Compute(withoutSecond, BundleId);
        string withSecondHash = ProvenanceSnapshotRevisionHasher.Compute(withSecond, BundleId);

        withSecondHash.Should().NotBe(withoutSecondHash);
    }

    [Fact]
    public void Compute_is_order_invariant_when_bundle_lists_duplicate_artifact_id_with_conflicting_content_hashes()
    {
        Guid artifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        SynthesizedArtifact v1 = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        SynthesizedArtifact v2 = new()
        {
            ArtifactId = artifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v2",
            ContentHash = "hash-v2",
        };

        string forward = ProvenanceSnapshotRevisionHasher.Compute(CreateInput([v1, v2]), BundleId);
        string reverse = ProvenanceSnapshotRevisionHasher.Compute(CreateInput([v2, v1]), BundleId);

        reverse.Should().Be(forward);
    }

    [Fact]
    public void Compute_ignores_duplicate_artifact_rows_with_same_artifact_id()
    {
        SynthesizedArtifact artifact = new()
        {
            ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "v1",
            ContentHash = "hash-v1",
        };

        ProvenanceBuildInput single = CreateInput([artifact]);
        ProvenanceBuildInput duplicated = CreateInput([artifact, artifact]);

        ProvenanceSnapshotRevisionHasher.Compute(single, BundleId)
            .Should().Be(ProvenanceSnapshotRevisionHasher.Compute(duplicated, BundleId));
    }

    private static Finding CreateSampleFinding() =>
        new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "sec",
            EngineType = "compliance",
            Severity = FindingSeverity.Warning,
            Title = "Finding",
            Rationale = "r",
            RelatedNodeIds = ["node-a"],
        };

    private static ProvenanceBuildInput CreateInput(
        IReadOnlyList<SynthesizedArtifact> artifacts,
        IReadOnlyList<string>? appliedRuleIds = null,
        IReadOnlyList<Finding>? findings = null,
        string? manifestHash = null,
        IReadOnlyList<ResolvedArchitectureDecision>? decisions = null,
        IReadOnlyList<GraphNode>? graphNodes = null,
        IReadOnlyList<GraphEdge>? graphEdges = null)
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid graphSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Guid manifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid decisionTraceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        RuleAuditTracePayload tracePayload = new()
        {
            DecisionTraceId = decisionTraceId,
            RunId = RunId,
        };

        if (appliedRuleIds is not null)
            tracePayload.AppliedRuleIds.AddRange(appliedRuleIds);

        return new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot
            {
                FindingsSnapshotId = findingsSnapshotId,
                RunId = RunId,
                ContextSnapshotId = ContextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
                Findings = findings is null ? [] : [.. findings],
            },
            Graph = new GraphSnapshot
            {
                GraphSnapshotId = graphSnapshotId,
                ContextSnapshotId = ContextSnapshotId,
                RunId = RunId,
                Nodes = graphNodes is null ? [] : [.. graphNodes],
                Edges = graphEdges is null ? [] : [.. graphEdges],
            },
            Manifest = new ManifestDocument
            {
                ManifestId = manifestId,
                RunId = RunId,
                ContextSnapshotId = ContextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
                FindingsSnapshotId = findingsSnapshotId,
                ManifestHash = manifestHash ?? "mh",
                Decisions = decisions is null ? [] : [.. decisions],
            },
            DecisionTrace = RuleAuditTraceDto.From(tracePayload),
            Artifacts = artifacts,
        };
    }
}
