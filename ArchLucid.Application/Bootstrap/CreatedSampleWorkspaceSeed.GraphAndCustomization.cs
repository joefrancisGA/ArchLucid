using System.IO;

using ArchLucid.Application.Authority;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Bootstrap;

internal static partial class CreatedSampleWorkspaceSeed
{
    internal static GraphSnapshot BuildGraphSnapshot(Guid graphSnapshotId, Guid contextSnapshotId, Guid runId, DateTime createdUtc)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = graphSnapshotId,
            ContextSnapshotId = contextSnapshotId,
            RunId = runId,
            CreatedUtc = createdUtc,
            Warnings = [],
        };

        graph.Nodes.AddRange(
        [
            new GraphNode
            {
                NodeId = "node-apim",
                NodeType = "gateway",
                Label = "API Management gateway",
                Category = "edge",
                SourceType = "created-sample-seed",
                SourceId = "evidence-copilot-architecture-brief.md",
            },
            new GraphNode
            {
                NodeId = "node-orchestrator",
                NodeType = "service",
                Label = "Chat orchestration worker",
                Category = "compute",
                SourceType = "created-sample-seed",
                SourceId = "evidence-orchestration-runbook.md",
            },
            new GraphNode
            {
                NodeId = "node-search",
                NodeType = "service",
                Label = "Azure AI Search retrieval",
                Category = "ai",
                SourceType = "created-sample-seed",
                SourceId = "evidence-search-index-profile.json",
            },
            new GraphNode
            {
                NodeId = "node-openai",
                NodeType = "service",
                Label = "Azure OpenAI completions",
                Category = "ai",
                SourceType = "created-sample-seed",
                SourceId = "evidence-openai-private-endpoint-diagram.pdf",
            },
        ]);

        graph.Edges.AddRange(
        [
            new GraphEdge { EdgeId = "edge-apim-orchestrator", FromNodeId = "node-apim", ToNodeId = "node-orchestrator", EdgeType = "routesTo", Weight = 1 },
            new GraphEdge { EdgeId = "edge-orchestrator-search", FromNodeId = "node-orchestrator", ToNodeId = "node-search", EdgeType = "readsFrom", Weight = 1 },
            new GraphEdge { EdgeId = "edge-orchestrator-openai", FromNodeId = "node-orchestrator", ToNodeId = "node-openai", EdgeType = "calls", Weight = 1 },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(
        Guid authorityRunGuid,
        Guid graphSnapshotId,
        Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        IReadOnlyList<string> auditNotes =
        [
            "Decision REMEDIATE (finding private-inference-egress) — private link cutover tracked on platform backlog.",
            "Decision REMEDIATE (finding content-safety-gap) — APIM policy attachment before workforce pilot.",
            "Decision ACCEPT_RISK (finding index-redaction-coverage) for synthetic evaluator corpus only.",
        ];

        GraphSnapshot graph = BuildGraphSnapshot(graphSnapshotId, contextSnapshotId, authorityRunGuid, snapshotUtc);

        return new AuthorityCommittedChainSeedCustomization
        {
            AdditionalCanonicalObjects = BuildSyntheticEvidenceObjects(authorityRunGuid),
            AdditionalRuleAuditNotes = auditNotes,
            GraphSnapshotOverride = graph,
        };
    }

    private static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");

        return
        [
            EvidenceDoc(seed, "copilot-architecture-brief.md", "Guided-intake goals and constraints for enterprise internal copilot."),
            EvidenceDoc(seed, "rag-retrieval-design-notes.md", "Hybrid retrieval and grounding posture for corporate document corpus."),
            EvidenceDoc(seed, "content-safety-checklist.json", "Responsible AI hooks and human-in-loop escalation matrix (synthetic)."),
            EvidenceDoc(seed, "private-endpoint-diagram.pdf", "Hub-spoke layout with private Azure OpenAI and AI Search endpoints."),
        ];
    }

    private static CanonicalObject EvidenceDoc(string seed, string filename, string summary)
    {
        return new CanonicalObject
        {
            ObjectType = "evidence_attachment",
            Name = filename,
            SourceType = "created-sample-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firmLabel"] = "Enterprise sample (synthetic)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
