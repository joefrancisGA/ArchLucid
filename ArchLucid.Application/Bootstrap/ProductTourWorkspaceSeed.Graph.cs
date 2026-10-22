using ArchLucid.Application.Authority;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Bootstrap;

internal static partial class ProductTourWorkspaceSeed
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
                Label = "API Management façade",
                Category = "edge",
                SourceType = "product-tour-seed",
                SourceId = "evidence-azure-subscription-inventory.pdf",
            },
            new GraphNode
            {
                NodeId = "node-aca-batch",
                NodeType = "service",
                Label = "Container Apps AI batch plane",
                Category = "compute",
                SourceType = "product-tour-seed",
                SourceId = "evidence-contoso-diagram.pdf",
            },
            new GraphNode
            {
                NodeId = "node-openai",
                NodeType = "service",
                Label = "Azure OpenAI inference gateway",
                Category = "ai",
                SourceType = "product-tour-seed",
                SourceId = "evidence-responsible-ai-readiness-checklist.json",
            },
            new GraphNode
            {
                NodeId = "node-cosmos",
                NodeType = "datastore",
                Label = "Cosmos partitions (synthetic corpus)",
                Category = "data",
                SourceType = "product-tour-seed",
                SourceId = "evidence-training-corpus-ingest",
            },
            new GraphNode
            {
                NodeId = "node-kv",
                NodeType = "security",
                Label = "Key Vault — platform secrets bridge",
                Category = "secrets",
                SourceType = "product-tour-seed",
                SourceId = "evidence-kv-health-probe.json",
            },
        ]);

        graph.Edges.AddRange(
        [
            new GraphEdge { EdgeId = "edge-apim-aca", FromNodeId = "node-apim", ToNodeId = "node-aca-batch", EdgeType = "routesTo", Weight = 1 },
            new GraphEdge { EdgeId = "edge-aca-cosmos", FromNodeId = "node-aca-batch", ToNodeId = "node-cosmos", EdgeType = "writes", Weight = 1 },
            new GraphEdge { EdgeId = "edge-openai-cosmos", FromNodeId = "node-openai", ToNodeId = "node-cosmos", EdgeType = "readsFrom", Weight = 1 },
            new GraphEdge { EdgeId = "edge-openai-kv", FromNodeId = "node-openai", ToNodeId = "node-kv", EdgeType = "authenticatesWith", Weight = 1 },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(Guid authorityRunGuid, Guid graphSnapshotId, Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        IReadOnlyList<string> auditNotes =
        [
            "Decision ACCEPT_RISK (finding product-tour-ingress) subject to Defender alert choreography + CAB attestation uploads.",
            "Decision REMEDIATE (finding product-tour-privatelink / product-tour-ai-review-gate) — template + Trusted AI playbook owners assigned.",
            "Decision DEFER observability uplift (finding product-tour-log-forwarding) for synthetic evaluator subscription only.",
        ];

        GraphSnapshot graph = BuildGraphSnapshot(graphSnapshotId, contextSnapshotId, authorityRunGuid, snapshotUtc);

        return new AuthorityCommittedChainSeedCustomization
        {
            AdditionalCanonicalObjects = BuildSyntheticEvidenceObjects(authorityRunGuid),
            AdditionalRuleAuditNotes = auditNotes,
            GraphSnapshotOverride = graph,
        };
    }
}
