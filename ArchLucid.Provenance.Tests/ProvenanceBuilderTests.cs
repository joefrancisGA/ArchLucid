using System.Text;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Serialization;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Provenance.Tests;

/// <summary>
///     Covers <see cref="ProvenanceBuilder" /> graph construction (high line count; drives package coverage gate).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProvenanceBuilderTests
{
    private static readonly Guid RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public void Build_minimal_inputs_yields_only_manifest_node_and_no_edges()
    {
        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "hash-min", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(
                new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = []
        });

        graph.RunId.Should().Be(RunId);
        graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Manifest);
        graph.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Build_treats_null_graph_nodes_findings_and_manifest_decisions_as_empty()
    {
        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = null! },
            Graph = new GraphSnapshot { Nodes = null! },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "hash-min",
                Decisions = null!,
            },
            DecisionTrace = RuleAuditTraceDto.From(
                new RuleAuditTracePayload { AppliedRuleIds = null! }),
            Artifacts = [],
        });

        graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Manifest);
        graph.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Build_succeeds_when_graph_snapshot_projection_has_null_node_list()
    {
        GraphSnapshot graphSnapshot = GraphJsonSerialization.DeserializeSnapshot(
            Encoding.UTF8.GetBytes("{\"nodes\":null,\"edges\":null}"))
            ?? new GraphSnapshot();

        graphSnapshot.Nodes = null!;

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = graphSnapshot,
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "hash-min", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(
                new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Manifest);
    }

    [Fact]
    public void Build_produces_same_graph_shape_when_only_rule_set_hash_changes()
    {
        RuleAuditTracePayload baselineAudit = new() { AppliedRuleIds = ["rule-a"], RuleSetHash = "hash-1" };
        RuleAuditTracePayload updatedAudit = new() { AppliedRuleIds = ["rule-a"], RuleSetHash = "hash-2" };

        ProvenanceBuildInput baselineInput = new()
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(baselineAudit),
            Artifacts = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph baselineGraph = sut.Build(baselineInput);
        DecisionProvenanceGraph updatedGraph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(updatedAudit),
            Artifacts = [],
        });

        baselineGraph.Nodes.Select(n => n.Type).Should().Equal(updatedGraph.Nodes.Select(n => n.Type));
        baselineGraph.Edges.Select(e => e.Type).Should().Equal(updatedGraph.Edges.Select(e => e.Type));
    }

    [Fact]
    public void Build_finding_node_includes_agent_execution_trace_correlation()
    {
        const string traceId = "abc123def456";

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "find-trace",
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "AI finding",
                    Rationale = "r",
                    AgentExecutionTraceId = traceId
                }
            ]
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = []
        });

        ProvenanceNode findingNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Finding).Subject;
        findingNode.AgentExecutionTraceId.Should().Be(traceId);
        findingNode.Metadata[ProvenanceMetadataKeys.AgentExecutionTraceId].Should().Be(traceId);
    }

    [Fact]
    public void Build_normalizes_surrounding_whitespace_on_agent_execution_trace_correlation()
    {
        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "find-trace-padded",
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "AI finding",
                    Rationale = "r",
                    AgentExecutionTraceId = "  abc123def456  "
                }
            ]
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = []
        });

        ProvenanceNode findingNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Finding).Subject;
        findingNode.AgentExecutionTraceId.Should().Be("abc123def456");
        findingNode.Metadata[ProvenanceMetadataKeys.AgentExecutionTraceId].Should().Be("abc123def456");
    }

    [Fact]
    public void Build_normalizes_surrounding_whitespace_on_trace_fallback_correlation()
    {
        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "find-trace-fallback",
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "AI finding",
                    Rationale = "r",
                    Trace = new ExplainabilityTrace
                    {
                        SourceAgentExecutionTraceId = "  abc123def456  ",
                    },
                },
            ],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode findingNode =
            graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Finding).Subject;
        findingNode.AgentExecutionTraceId.Should().Be("abc123def456");
        findingNode.Metadata[ProvenanceMetadataKeys.AgentExecutionTraceId].Should().Be("abc123def456");
    }

    [Fact]
    public void Build_full_chain_materializes_nodes_and_all_edge_types()
    {
        const string graphNodeId = "gn-1";
        const string findingId = "find-1";
        const string decisionId = "dec-1";
        const string ruleId = "rule-z";

        GraphSnapshot graphSnap = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = graphNodeId, NodeType = "Service", Label = "Labeled node", Category = "cat" },
                new GraphNode
                {
                    NodeId = graphNodeId, NodeType = "Service", Label = "duplicate id same key", Category = "cat"
                },
                new GraphNode { NodeId = "bare", NodeType = "Resource", Label = "   ", Category = null }
            ]
        };

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Finding title",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId, "not-in-graph"]
                }
            ]
        };

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = decisionId,
            Category = "c",
            Title = "Decide",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [findingId]
        };

        ManifestDocument manifest = new() { ManifestId = ManifestId, ManifestHash = "mh", Decisions = [decision] };

        RuleAuditTracePayload audit = new() { AppliedRuleIds = [ruleId, ruleId, ruleId.ToUpperInvariant()] };

        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [decisionId, "missing-decision"]
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = graphSnap,
            Manifest = manifest,
            DecisionTrace = RuleAuditTraceDto.From(audit),
            Artifacts = [artifact]
        });

        graph.Nodes.Should().HaveCount(7);
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.GraphNode && n.ReferenceId == graphNodeId);
        graph.Nodes.Should().Contain(n =>
            n.Type == ProvenanceNodeType.GraphNode && n.ReferenceId == "bare" && n.Name == "bare");
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Finding && n.ReferenceId == findingId);
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Rule && n.ReferenceId == ruleId);
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Decision && n.ReferenceId == decisionId);
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Artifact);
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Manifest);

        graph.Edges.Should().NotBeEmpty();
        graph.Edges.Should().Contain(e => e.Type == ProvenanceEdgeType.SupportedBy);
        graph.Edges.Should().Contain(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode);
        graph.Edges.Should().Contain(e => e.Type == ProvenanceEdgeType.TriggeredByRule);
        graph.Edges.Should().Contain(e => e.Type == ProvenanceEdgeType.ContributedToArtifact);
        graph.Edges.Should().Contain(e => e.Type == ProvenanceEdgeType.ContainedInManifest);
    }

    [Fact]
    public void Build_skips_supported_by_when_finding_node_missing()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "d-alone",
            Category = "c",
            Title = "T",
            SelectedOption = "o",
            Rationale = "r",
            SupportingFindingIds = ["no-such-finding"]
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [decision] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = []
        });

        graph.Edges.Should().ContainSingle(e => e.Type == ProvenanceEdgeType.ContainedInManifest);
        graph.Edges.Should().NotContain(e => e.Type == ProvenanceEdgeType.SupportedBy);
    }

    [Fact]
    public void Build_links_graph_influence_when_related_node_id_differs_only_by_case()
    {
        const string graphNodeId = "obj-svc-api";
        const string findingId = "find-case";

        GraphSnapshot graphSnap = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = graphNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = "compute",
                },
            ],
        };

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Case mismatch",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId.ToUpperInvariant()],
                },
            ],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = graphSnap,
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode graphNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;
        ProvenanceNode findingNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Finding).Subject;

        graph.Edges.Should().ContainSingle(e =>
            e.Type == ProvenanceEdgeType.InfluencedByGraphNode
            && e.FromNodeId == graphNode.Id
            && e.ToNodeId == findingNode.Id);
    }

    [Fact]
    public void Build_deduplicates_contributing_decision_ids_when_casing_differs_only()
    {
        const string decisionId = "dec-1";

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = decisionId,
            Category = "c",
            Title = "Decide",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [decisionId, decisionId.ToUpperInvariant()],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [decision] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [artifact],
        });

        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.ContributedToArtifact).Should().Be(1);
    }

    [Fact]
    public void Build_deduplicates_related_node_ids_when_casing_differs_only()
    {
        const string graphNodeId = "obj-svc-api";
        const string findingId = "find-case-dedup";

        GraphSnapshot graphSnap = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = graphNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = "compute",
                },
            ],
        };

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Duplicate related ids",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId, graphNodeId.ToUpperInvariant()],
                },
            ],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = graphSnap,
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode).Should().Be(1);
    }

    [Fact]
    public void Build_deduplicates_supporting_finding_ids_when_casing_differs_only()
    {
        const string findingId = "find-1";
        const string decisionId = "dec-1";

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Title",
                    Rationale = "r",
                },
            ],
        };

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = decisionId,
            Category = "c",
            Title = "Decide",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [findingId, findingId.ToUpperInvariant()],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [decision] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.SupportedBy).Should().Be(1);
    }

    [Fact]
    public void Build_preserves_decision_title_when_later_case_variant_row_omits_title()
    {
        ResolvedArchitectureDecision firstRow = new()
        {
            DecisionId = "dec-1",
            Category = "security",
            Title = "Enable WAF",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ResolvedArchitectureDecision secondRow = new()
        {
            DecisionId = "DEC-1",
            Category = string.Empty,
            Title = string.Empty,
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [firstRow, secondRow],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Decision && n.Name == "Enable WAF");
    }

    [Fact]
    public void Build_uses_decision_id_when_title_is_whitespace_only()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-1",
            Category = "security",
            Title = "   ",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [decision],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Decision && n.Name == "dec-1");
    }

    [Fact]
    public void Build_preserves_decision_title_when_later_case_variant_row_has_whitespace_only_title()
    {
        ResolvedArchitectureDecision firstRow = new()
        {
            DecisionId = "dec-1",
            Category = "security",
            Title = "Enable WAF",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ResolvedArchitectureDecision secondRow = new()
        {
            DecisionId = "DEC-1",
            Category = string.Empty,
            Title = "   ",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [firstRow, secondRow],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Decision && n.Name == "Enable WAF");
    }

    [Fact]
    public void Build_deduplicates_contained_in_manifest_when_manifest_lists_case_variant_decision_ids()
    {
        ResolvedArchitectureDecision lower = new()
        {
            DecisionId = "dec-1",
            Category = "c",
            Title = "Lower",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ResolvedArchitectureDecision upper = new()
        {
            DecisionId = "DEC-1",
            Category = "c",
            Title = "Upper",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [lower, upper],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes.Count(n => n.Type == ProvenanceNodeType.Decision).Should().Be(1);
        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.ContainedInManifest).Should().Be(1);
    }

    [Fact]
    public void Build_deduplicates_influenced_by_graph_node_when_findings_list_case_variant_finding_ids()
    {
        const string graphNodeId = "node-1";
        const string findingId = "finding-1";

        GraphSnapshot graphSnap = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = graphNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
        };

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Lower case id",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId],
                },
                new Finding
                {
                    FindingId = findingId.ToUpperInvariant(),
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Upper case id",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId],
                },
            ],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = graphSnap,
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes.Count(n => n.Type == ProvenanceNodeType.Finding).Should().Be(1);
        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode).Should().Be(1);
    }

    [Fact]
    public void Build_preserves_graph_node_label_when_later_case_variant_row_omits_label()
    {
        GraphNode firstRow = new()
        {
            NodeId = "node-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "API Gateway",
        };

        GraphNode secondRow = new()
        {
            NodeId = "NODE-A",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = string.Empty,
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [firstRow, secondRow] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode && n.Name == "API Gateway");
    }

    [Fact]
    public void Build_uses_last_graph_node_label_when_snapshot_lists_case_variant_node_ids()
    {
        GraphNode firstRow = new()
        {
            NodeId = "node-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "First label",
        };

        GraphNode secondRow = new()
        {
            NodeId = "NODE-A",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "Last label",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [firstRow, secondRow] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode && n.Name == "Last label");
    }

    [Fact]
    public void Build_preserves_agent_execution_trace_id_when_later_case_variant_row_omits_trace()
    {
        Finding firstRow = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "Finding",
            Rationale = "r",
            AgentExecutionTraceId = "trace-v1",
        };

        Finding secondRow = new()
        {
            FindingId = "FIND-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "Finding",
            Rationale = "r",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [firstRow, secondRow] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n =>
                n.Type == ProvenanceNodeType.Finding
                && n.AgentExecutionTraceId == "trace-v1");
    }

    [Fact]
    public void Build_uses_last_finding_title_when_findings_list_case_variant_ids()
    {
        Finding firstRow = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "First title",
            Rationale = "r",
        };

        Finding secondRow = new()
        {
            FindingId = "FIND-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "Last title",
            Rationale = "r",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [firstRow, secondRow] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Finding && n.Name == "Last title");
    }

    [Fact]
    public void Build_trims_decision_title_on_duplicate_key_merge_when_later_row_has_padded_title()
    {
        ResolvedArchitectureDecision firstRow = new()
        {
            DecisionId = "dec-1",
            Category = "security",
            Title = "Enable WAF",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ResolvedArchitectureDecision secondRow = new()
        {
            DecisionId = "dec-1",
            Category = "security",
            Title = "  Enable regional WAF  ",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [firstRow, secondRow],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Decision && n.Name == "Enable regional WAF");
    }

    [Fact]
    public void Build_trims_artifact_name_on_duplicate_key_merge_when_later_row_has_padded_name()
    {
        SynthesizedArtifact firstRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview-old.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        SynthesizedArtifact secondRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "  overview-renamed.md  ",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [firstRow, secondRow],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Artifact && n.Name == "overview-renamed.md");
    }

    [Fact]
    public void Build_trims_finding_title_on_duplicate_key_merge_when_later_row_has_padded_title()
    {
        Finding firstRow = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "First title",
            Rationale = "r",
        };

        Finding secondRow = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "  Last title  ",
            Rationale = "r",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [firstRow, secondRow] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Finding && n.Name == "Last title");
    }

    [Fact]
    public void Build_duplicate_finding_id_reuses_single_node()
    {
        Finding f = new()
        {
            FindingId = "same",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "a",
            Rationale = "r"
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [f, f] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = []
        });

        graph.Nodes.Count(n => n.Type == ProvenanceNodeType.Finding).Should().Be(1);
    }

    [Fact]
    public void Build_preserves_artifact_name_when_later_duplicate_row_omits_name()
    {
        SynthesizedArtifact firstRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        SynthesizedArtifact secondRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = string.Empty,
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [firstRow, secondRow],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Artifact && n.Name == "overview.md");
    }

    [Fact]
    public void Build_uses_artifact_id_when_name_is_whitespace_only()
    {
        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "   ",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [artifact],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n =>
                n.Type == ProvenanceNodeType.Artifact
                && n.Name == ArtifactId.ToString("N"));
    }

    [Fact]
    public void Build_normalizes_manifest_hash_metadata()
    {
        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "  deadbeef  ",
                Decisions = [],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode manifestNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Manifest).Subject;
        manifestNode.Metadata["manifestHash"].Should().Be("deadbeef");
    }

    [Fact]
    public void Build_normalizes_whitespace_only_manifest_hash_metadata_to_empty()
    {
        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "   ",
                Decisions = [],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode manifestNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Manifest).Subject;
        manifestNode.Metadata["manifestHash"].Should().BeEmpty();
    }

    [Fact]
    public void Build_trims_padded_artifact_name_type_and_format_on_initial_projection()
    {
        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "  doc  ",
            Name = "  overview.md  ",
            Format = "  md  ",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [artifact],
        });

        ProvenanceNode artifactNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Artifact).Subject;
        artifactNode.Name.Should().Be("overview.md");
        artifactNode.Metadata["artifactType"].Should().Be("doc");
        artifactNode.Metadata["format"].Should().Be("md");
    }

    [Fact]
    public void Build_normalizes_whitespace_only_artifact_type_and_format_in_metadata()
    {
        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "   ",
            Name = "overview.md",
            Format = "   ",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [artifact],
        });

        ProvenanceNode artifactNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.Artifact).Subject;
        artifactNode.Metadata["artifactType"].Should().BeEmpty();
        artifactNode.Metadata["format"].Should().BeEmpty();
    }

    [Fact]
    public void Build_preserves_artifact_name_when_later_duplicate_row_has_whitespace_only_name()
    {
        SynthesizedArtifact firstRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        SynthesizedArtifact secondRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "   ",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [firstRow, secondRow],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Artifact && n.Name == "overview.md");
    }

    [Fact]
    public void Build_uses_last_artifact_name_when_bundle_lists_duplicate_artifact_ids()
    {
        SynthesizedArtifact firstRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview-old.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        SynthesizedArtifact secondRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview-renamed.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [firstRow, secondRow],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Artifact && n.Name == "overview-renamed.md");
    }

    [Fact]
    public void Build_unions_contributing_decision_ids_when_bundle_lists_duplicate_artifact_rows()
    {
        const string decisionA = "dec-a";
        const string decisionB = "dec-b";

        ResolvedArchitectureDecision decisionOne = new()
        {
            DecisionId = decisionA,
            Category = "c",
            Title = "Decision A",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ResolvedArchitectureDecision decisionTwo = new()
        {
            DecisionId = decisionB,
            Category = "c",
            Title = "Decision B",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        SynthesizedArtifact firstRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [decisionA],
        };

        SynthesizedArtifact secondRow = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [decisionB],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [decisionOne, decisionTwo],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [firstRow, secondRow],
        });

        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.ContributedToArtifact).Should().Be(2);
    }

    [Fact]
    public void Build_deduplicates_contributed_to_artifact_when_artifact_bundle_lists_duplicate_entries()
    {
        const string decisionId = "dec-1";

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = decisionId,
            Category = "c",
            Title = "Decide",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        SynthesizedArtifact artifact = new()
        {
            ArtifactId = ArtifactId,
            ArtifactType = "doc",
            Name = "overview.md",
            Format = "md",
            Content = "x",
            ContentHash = "h",
            ContributingDecisionIds = [decisionId],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [decision],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [artifact, artifact],
        });

        graph.Nodes.Count(n => n.Type == ProvenanceNodeType.Artifact).Should().Be(1);
        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.ContributedToArtifact).Should().Be(1);
    }

    [Fact]
    public void Build_deduplicates_triggered_by_rule_when_applied_rule_ids_differ_only_by_whitespace()
    {
        const string decisionId = "dec-1";
        const string ruleId = "rule-1";

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = decisionId,
            Category = "c",
            Title = "Decide",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [decision],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                AppliedRuleIds = [ruleId, $"{ruleId} "],
            }),
            Artifacts = [],
        });

        graph.Nodes.Count(n => n.Type == ProvenanceNodeType.Rule).Should().Be(1);
        graph.Edges.Count(e => e.Type == ProvenanceEdgeType.TriggeredByRule).Should().Be(1);
    }

    [Fact]
    public void Build_links_graph_influence_when_graph_node_id_differs_only_by_surrounding_whitespace()
    {
        const string graphNodeId = "node-1";
        const string findingId = "finding-1";

        GraphSnapshot graphSnap = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = $"{graphNodeId} ",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
        };

        FindingsSnapshot findings = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = findingId,
                    FindingType = "Compliance",
                    Category = "sec",
                    EngineType = "e",
                    Severity = FindingSeverity.Warning,
                    Title = "Finding",
                    Rationale = "r",
                    RelatedNodeIds = [graphNodeId],
                },
            ],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = findings,
            Graph = graphSnap,
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Edges.Should().ContainSingle(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode);
    }

    [Fact]
    public void Build_trims_surrounding_whitespace_on_finding_and_decision_display_titles()
    {
        Finding finding = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "  Finding title  ",
            Rationale = "r",
        };

        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-1",
            Category = "c",
            Title = "  Decision title  ",
            SelectedOption = "opt",
            Rationale = "why",
            SupportingFindingIds = [],
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [finding] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument
            {
                ManifestId = ManifestId,
                ManifestHash = "h",
                Decisions = [decision],
            },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Finding && n.Name == "Finding title");
        graph.Nodes.Should().Contain(n => n.Type == ProvenanceNodeType.Decision && n.Name == "Decision title");
    }

    [Fact]
    public void Build_trims_surrounding_whitespace_on_graph_node_display_name()
    {
        GraphNode node = new()
        {
            NodeId = "node-a",
            NodeType = "Service",
            Label = "  API Gateway  ",
            Category = "network",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [node] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode && n.Name == "API Gateway");
    }

    [Fact]
    public void Build_trims_padded_graph_node_type_and_category_in_metadata()
    {
        GraphNode node = new()
        {
            NodeId = "node-a",
            NodeType = "  Service  ",
            Label = "API Gateway",
            Category = "  network  ",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [node] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode graphNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;
        graphNode.Metadata["nodeType"].Should().Be("Service");
        graphNode.Metadata["category"].Should().Be("network");
    }

    [Fact]
    public void Build_produces_same_graph_provenance_node_when_only_property_bag_differs()
    {
        GraphNode baselineNode = new()
        {
            NodeId = "node-a",
            NodeType = "Service",
            Label = "API Gateway",
            Category = "network",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["k8s.kind"] = "Deployment",
            },
        };

        GraphNode updatedNode = new()
        {
            NodeId = "node-a",
            NodeType = "Service",
            Label = "API Gateway",
            Category = "network",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["k8s.kind"] = "Service",
            },
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph baselineGraph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [baselineNode] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        DecisionProvenanceGraph updatedGraph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [updatedNode] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode baselineProvenanceNode = baselineGraph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;
        ProvenanceNode updatedProvenanceNode = updatedGraph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;

        updatedProvenanceNode.Name.Should().Be(baselineProvenanceNode.Name);
        updatedProvenanceNode.Metadata.Should().BeEquivalentTo(baselineProvenanceNode.Metadata);
    }

    [Fact]
    public void Build_produces_same_provenance_graph_when_only_graph_edge_metadata_differs()
    {
        GraphNode node = new()
        {
            NodeId = "node-a",
            NodeType = "Service",
            Label = "API",
            Category = "network",
        };

        GraphEdge baselineEdge = new()
        {
            EdgeId = "edge-1",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["diagram.sourceEvidence"] = "doc-a",
            },
            ReasoningTrace = "baseline",
        };

        GraphEdge updatedEdge = new()
        {
            EdgeId = "edge-2",
            FromNodeId = "node-a",
            ToNodeId = "node-b",
            EdgeType = "ConnectsTo",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["diagram.sourceEvidence"] = "doc-b",
            },
            ReasoningTrace = "updated",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph baselineGraph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [node], Edges = [baselineEdge] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        DecisionProvenanceGraph updatedGraph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [node], Edges = [updatedEdge] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        baselineGraph.Nodes.Should().HaveCount(updatedGraph.Nodes.Count);
        baselineGraph.Edges.Should().HaveCount(updatedGraph.Edges.Count);

        ProvenanceNode baselineGraphNode = baselineGraph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;
        ProvenanceNode updatedGraphNode = updatedGraph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;

        updatedGraphNode.Name.Should().Be(baselineGraphNode.Name);
        updatedGraphNode.Metadata.Should().BeEquivalentTo(baselineGraphNode.Metadata);
        updatedGraph.Edges.Select(e => e.Type).Should().Equal(baselineGraph.Edges.Select(e => e.Type));
    }

    [Fact]
    public void Build_normalizes_whitespace_only_graph_node_category_and_node_type_in_metadata()
    {
        GraphNode node = new()
        {
            NodeId = "node-a",
            NodeType = "   ",
            Label = "API",
            Category = "   ",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [node] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        ProvenanceNode graphNode = graph.Nodes.Should().ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode).Subject;
        graphNode.Metadata["category"].Should().BeEmpty();
        graphNode.Metadata["nodeType"].Should().BeEmpty();
    }

    [Fact]
    public void Build_uses_finding_id_when_title_is_whitespace_only()
    {
        Finding finding = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "   ",
            Rationale = "r",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [finding] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Finding && n.Name == "find-1");
    }

    [Fact]
    public void Build_preserves_finding_title_when_later_case_variant_row_has_whitespace_only_title()
    {
        Finding firstRow = new()
        {
            FindingId = "find-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "Buyer-visible title",
            Rationale = "r",
        };

        Finding secondRow = new()
        {
            FindingId = "FIND-1",
            FindingType = "t",
            Category = "c",
            EngineType = "e",
            Severity = FindingSeverity.Info,
            Title = "   ",
            Rationale = "r",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [firstRow, secondRow] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.Finding && n.Name == "Buyer-visible title");
    }

    [Fact]
    public void Build_preserves_graph_node_label_when_later_case_variant_row_has_whitespace_only_label()
    {
        GraphNode firstRow = new()
        {
            NodeId = "node-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "API Gateway",
        };

        GraphNode secondRow = new()
        {
            NodeId = "NODE-A",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "   ",
        };

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [firstRow, secondRow] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Nodes
            .Should()
            .ContainSingle(n => n.Type == ProvenanceNodeType.GraphNode && n.Name == "API Gateway");
    }

    [Fact]
    public void Build_ignores_blank_applied_rule_ids_when_emitting_rule_nodes()
    {
        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot { Findings = [] },
            Graph = new GraphSnapshot { Nodes = [] },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                AppliedRuleIds = ["rule-a", "  ", string.Empty],
            }),
            Artifacts = [],
        });

        graph.Nodes
            .Where(n => n.Type == ProvenanceNodeType.Rule)
            .Should()
            .ContainSingle()
            .Which.ReferenceId.Should().Be("rule-a");
    }

    [Fact]
    public void Build_ignores_blank_related_node_ids_when_linking_findings_to_graph_nodes()
    {
        const string graphNodeId = "graph-node-a";
        const string findingId = "finding-1";

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = findingId,
                        FindingType = "t",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Info,
                        Title = "Finding",
                        Rationale = "r",
                        RelatedNodeIds = ["", "   ", graphNodeId],
                    },
                ],
            },
            Graph = new GraphSnapshot
            {
                Nodes =
                [
                    new GraphNode
                    {
                        NodeId = graphNodeId,
                        NodeType = "Service",
                        Label = "Node",
                    },
                ],
            },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Edges
            .Where(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode)
            .Should()
            .ContainSingle();
    }

    [Fact]
    public void Build_skips_influence_edges_for_related_node_ids_not_present_in_graph_snapshot()
    {
        const string presentGraphNodeId = "graph-node-present";
        const string missingGraphNodeId = "graph-node-missing";
        const string findingId = "finding-missing-related";

        ProvenanceBuilder sut = new();
        DecisionProvenanceGraph graph = sut.Build(new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = findingId,
                        FindingType = "t",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Info,
                        Title = "Finding",
                        Rationale = "r",
                        RelatedNodeIds = [presentGraphNodeId, missingGraphNodeId],
                    },
                ],
            },
            Graph = new GraphSnapshot
            {
                Nodes =
                [
                    new GraphNode
                    {
                        NodeId = presentGraphNodeId,
                        NodeType = "Service",
                        Label = "Present",
                    },
                ],
            },
            Manifest = new ManifestDocument { ManifestId = ManifestId, ManifestHash = "h", Decisions = [] },
            DecisionTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload { AppliedRuleIds = [] }),
            Artifacts = [],
        });

        graph.Edges
            .Where(e => e.Type == ProvenanceEdgeType.InfluencedByGraphNode)
            .Should()
            .ContainSingle();

        graph.Nodes
            .Where(n => n.Type == ProvenanceNodeType.GraphNode && n.ReferenceId == missingGraphNodeId)
            .Should()
            .BeEmpty();
    }
}
