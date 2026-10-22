using ArchLucid.Application.Authority;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Bootstrap;

internal static partial class RegulatedScenarioWorkspaceSeed
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
                NodeId = "node-infer",
                NodeType = "ai_service",
                Label = "Scoring inference API",
                Category = "ai",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-monitoring-drift-config.yaml",
            },
            new GraphNode
            {
                NodeId = "node-train",
                NodeType = "ml_pipeline",
                Label = "AML training orchestration",
                Category = "training",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-training-pipeline-overview.md",
            },
            new GraphNode
            {
                NodeId = "node-lake",
                NodeType = "data_lake",
                Label = "Curated modeling lake",
                Category = "data",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-alpine-data-classification-matrix.xlsx",
            },
            new GraphNode
            {
                NodeId = "node-registry",
                NodeType = "model_registry",
                Label = "Model registry",
                Category = "governance",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-alpine-model-registry-export.csv",
            },
        ]);

        graph.Edges.AddRange(
        [
            new GraphEdge
            {
                EdgeId = "edge-train-lake",
                FromNodeId = "node-train",
                ToNodeId = "node-lake",
                EdgeType = "materializes",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-infer-lake",
                FromNodeId = "node-infer",
                ToNodeId = "node-lake",
                EdgeType = "readsFrom",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-train-registry",
                FromNodeId = "node-train",
                ToNodeId = "node-registry",
                EdgeType = "registers",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-infer-registry",
                FromNodeId = "node-infer",
                ToNodeId = "node-registry",
                EdgeType = "binds",
                Weight = 1,
            },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(Guid authorityRunGuid, Guid graphSnapshotId, Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        IReadOnlyList<string> auditNotes =
        [
            "Decision REMEDIATE (public inference listener) — Meridian security pod tracks ALP-441 to private APIM only.",
            "Decision REMEDIATE (model lineage hash gap) — ML platform enables digest attestation prior to next synthetic promotion window.",
            "Decision ACCEPT_RISK (human gate attestation) with CAB minutes + temporary dual-review waiver (evaluator tenant).",
            "Decision WAIVE_CONDITIONAL (CMK parity) pending FinOps budget micro-approval for synthetic subscription.",
            "Decision DEFER (observability workbook binding) after tour refresh so marketing screenshots stay stable.",
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
