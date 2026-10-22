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

    private static ProvenanceBuildInput CreateInput(
        IReadOnlyList<SynthesizedArtifact> artifacts,
        IReadOnlyList<string>? appliedRuleIds = null,
        IReadOnlyList<Finding>? findings = null,
        string? manifestHash = null,
        IReadOnlyList<ResolvedArchitectureDecision>? decisions = null,
        IReadOnlyList<GraphNode>? graphNodes = null)
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
                GraphSnapshotId = graphSnapshotId,
                Findings = findings is null ? [] : [.. findings],
            },
            Graph = new GraphSnapshot
            {
                GraphSnapshotId = graphSnapshotId,
                RunId = RunId,
                Nodes = graphNodes is null ? [] : [.. graphNodes],
            },
            Manifest = new ManifestDocument
            {
                ManifestId = manifestId,
                RunId = RunId,
                ManifestHash = manifestHash ?? "mh",
                Decisions = decisions is null ? [] : [.. decisions],
            },
            DecisionTrace = RuleAuditTraceDto.From(tracePayload),
            Artifacts = artifacts,
        };
    }
}
