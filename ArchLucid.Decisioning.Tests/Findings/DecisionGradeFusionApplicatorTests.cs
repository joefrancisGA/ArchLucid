using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class DecisionGradeFusionApplicatorTests
{
    [Fact]
    public void Apply_two_preferred_decision_grade_findings_sharing_a_node_emit_one_fusion()
    {
        Finding segmentation = CreateDecisionGradeFinding(
            "seg-1",
            "segmentation-semantics",
            "NSG permits 3389 from Internet",
            ["nsg-1"],
            ["doc:nsg.json#L10"]);
        Finding dataFlow = CreateDecisionGradeFinding(
            "df-1",
            "data-flow-trust-boundary",
            "Jump box path to PCI datastore",
            ["nsg-1", "sql-pay"],
            ["arn:aws:ec2:us-east-1:1:instance/i-1"]);

        List<Finding> findings = [segmentation, dataFlow];

        IReadOnlyList<Finding> fusionFindings = DecisionGradeFusionApplicator.Apply(findings);

        fusionFindings.Should().ContainSingle();
        Finding fusion = fusionFindings[0];
        fusion.EngineType.Should().Be(DecisionGradeFusionApplicator.EngineType);
        fusion.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        fusion.Title.Should().Be("Joined: data-flow-trust-boundary × segmentation-semantics on nsg-1");
        fusion.RelatedNodeIds.Should().Equal("nsg-1");
        fusion.EvidenceRefs.Should().BeEquivalentTo(["doc:nsg.json#L10", "arn:aws:ec2:us-east-1:1:instance/i-1"]);
        fusion.EvidenceRefs.Should().NotContain(static evidenceRef =>
            evidenceRef.StartsWith("graph-node:", StringComparison.OrdinalIgnoreCase));
        fusion.Rationale.Should().Contain("seg-1");
        fusion.Rationale.Should().Contain("df-1");
        fusion.Trace.Notes.Should().Contain("evidence:graph-node:nsg-1");

        DecisionGradeFusionFindingPayload payload =
            fusion.Payload.Should().BeOfType<DecisionGradeFusionFindingPayload>().Subject;
        payload.ConstituentFindingIds.Should().Equal("df-1", "seg-1");
        payload.SharedNodeIds.Should().Equal("nsg-1");
        payload.SourceEngineTypes.Should().Equal("data-flow-trust-boundary", "segmentation-semantics");

        findings.Should().HaveCount(2);
        findings.Should().OnlyContain(static finding =>
            finding.Classification == FindingClassification.DecisionGradeFinding
            && finding.EngineType != DecisionGradeFusionApplicator.EngineType);
    }

    [Fact]
    public void Apply_disjoint_related_nodes_does_not_fuse()
    {
        List<Finding> findings =
        [
            CreateDecisionGradeFinding("seg-1", "segmentation-semantics", "NSG open", ["nsg-1"]),
            CreateDecisionGradeFinding("df-1", "data-flow-trust-boundary", "Path to datastore", ["sql-pay"]),
        ];

        DecisionGradeFusionApplicator.Apply(findings).Should().BeEmpty();
    }

    [Fact]
    public void Apply_same_engine_type_sharing_a_node_does_not_fuse()
    {
        List<Finding> findings =
        [
            CreateDecisionGradeFinding("seg-1", "segmentation-semantics", "NSG 3389", ["nsg-1"]),
            CreateDecisionGradeFinding("seg-2", "segmentation-semantics", "NSG 22", ["nsg-1"]),
        ];

        DecisionGradeFusionApplicator.Apply(findings).Should().BeEmpty();
    }

    [Fact]
    public void Apply_does_not_fuse_checklist_coverage_with_decision_grade()
    {
        Finding decision = CreateDecisionGradeFinding(
            "seg-1",
            "segmentation-semantics",
            "NSG open",
            ["nsg-1"]);
        Finding checklist = CreateDecisionGradeFinding(
            "df-1",
            "data-flow-trust-boundary",
            "Path to datastore",
            ["nsg-1"]);
        checklist.Classification = FindingClassification.ChecklistCoverage;

        DecisionGradeFusionApplicator.Apply([decision, checklist]).Should().BeEmpty();
    }

    [Fact]
    public void Apply_three_engines_sharing_a_node_emit_one_fusion()
    {
        List<Finding> findings =
        [
            CreateDecisionGradeFinding("seg-1", "segmentation-semantics", "NSG 3389", ["sql-pay"]),
            CreateDecisionGradeFinding("df-1", "data-flow-trust-boundary", "Path to PCI", ["sql-pay"]),
            CreateDecisionGradeFinding("oc-1", "open-commitment", "Waiver expires in 6 days", ["sql-pay"]),
        ];

        IReadOnlyList<Finding> fusionFindings = DecisionGradeFusionApplicator.Apply(findings);

        fusionFindings.Should().ContainSingle();
        DecisionGradeFusionFindingPayload payload =
            fusionFindings[0].Payload.Should().BeOfType<DecisionGradeFusionFindingPayload>().Subject;
        payload.SourceEngineTypes.Should().HaveCount(3);
        payload.SourceEngineTypes.Should().Contain(["data-flow-trust-boundary", "open-commitment", "segmentation-semantics"]);
        fusionFindings[0].Title.Should().Contain("open-commitment");
        fusionFindings[0].Title.Should().Contain("on sql-pay");
    }

    [Fact]
    public void Apply_empty_or_all_checklist_returns_empty()
    {
        DecisionGradeFusionApplicator.Apply([]).Should().BeEmpty();

        Finding checklist = CreateDecisionGradeFinding(
            "seg-1",
            "segmentation-semantics",
            "NSG open",
            ["nsg-1"]);
        checklist.Classification = FindingClassification.ChecklistCoverage;

        DecisionGradeFusionApplicator.Apply([checklist]).Should().BeEmpty();
    }

    [Fact]
    public void Apply_caps_fused_findings_at_five()
    {
        List<Finding> findings = [];

        for (int index = 0; index < 6; index++)
        {
            string nodeId = $"node-{index}";
            findings.Add(CreateDecisionGradeFinding(
                $"seg-{index}",
                "segmentation-semantics",
                $"NSG {index}",
                [nodeId]));
            findings.Add(CreateDecisionGradeFinding(
                $"df-{index}",
                "data-flow-trust-boundary",
                $"Path {index}",
                [nodeId]));
        }

        IReadOnlyList<Finding> fusionFindings = DecisionGradeFusionApplicator.Apply(findings);

        fusionFindings.Should().HaveCount(DecisionGradeFusionApplicator.MaxFusionFindings);
    }

    [Fact]
    public void Apply_strips_synthetic_graph_node_evidence_refs()
    {
        Finding segmentation = CreateDecisionGradeFinding(
            "seg-1",
            "segmentation-semantics",
            "NSG open",
            ["nsg-1"],
            ["graph-node:nsg-1", "doc:nsg.json#L4"]);
        Finding dataFlow = CreateDecisionGradeFinding(
            "df-1",
            "data-flow-trust-boundary",
            "Path",
            ["nsg-1"],
            ["graph-node:sql-pay"]);

        Finding fusion = DecisionGradeFusionApplicator.Apply([segmentation, dataFlow]).Should().ContainSingle().Subject;

        fusion.EvidenceRefs.Should().Equal("doc:nsg.json#L4");
    }

    [Fact]
    public void Apply_non_preferred_engine_is_not_a_member()
    {
        List<Finding> findings =
        [
            CreateDecisionGradeFinding("seg-1", "segmentation-semantics", "NSG open", ["nsg-1"]),
            CreateDecisionGradeFinding("cov-1", "topology-coverage", "Node missing", ["nsg-1"]),
        ];

        DecisionGradeFusionApplicator.Apply(findings).Should().BeEmpty();
    }

    [Fact]
    public async Task DecisionGradeFusionStage_appends_fusion_and_preserves_constituents()
    {
        List<Finding> members =
        [
            CreateDecisionGradeFinding("seg-1", "segmentation-semantics", "NSG 3389", ["nsg-1"], ["doc:a#L1"]),
            CreateDecisionGradeFinding("df-1", "data-flow-trust-boundary", "Path to PCI", ["nsg-1"], ["doc:b#L2"]),
        ];

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
            },
            Snapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                Findings = members,
            },
        };

        FindingsDecisionGradeFusionStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot!.Findings.Should().HaveCount(3);
        context.Snapshot.Findings.Should().Contain(static finding => finding.FindingId == "seg-1");
        context.Snapshot.Findings.Should().Contain(static finding => finding.FindingId == "df-1");
        context.Snapshot.Findings.Should().ContainSingle(finding =>
            finding.EngineType == DecisionGradeFusionApplicator.EngineType);
        context.SuccessfulEngineTypes.Should().Contain(DecisionGradeFusionApplicator.EngineType);
    }

    [Fact]
    public async Task DecisionGradeFusionFindingEngine_analyze_returns_empty()
    {
        DecisionGradeFusionFindingEngine engine = new();
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
        };

        engine.EngineType.Should().Be(DecisionGradeFusionApplicator.EngineType);
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, null, CancellationToken.None);
        findings.Should().BeEmpty();
    }

    private static Finding CreateDecisionGradeFinding(
        string findingId,
        string engineType,
        string title,
        IReadOnlyList<string> relatedNodeIds,
        IReadOnlyList<string>? evidenceRefs = null)
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "TypedEngineFinding",
            Category = "Security",
            EngineType = engineType,
            Severity = FindingSeverity.Warning,
            Title = title,
            Rationale = title,
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            RelatedNodeIds = relatedNodeIds.ToList(),
            EvidenceRefs = (evidenceRefs ?? []).ToList(),
            Trace = new ExplainabilityTrace(),
        };
    }
}
