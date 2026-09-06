using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Canonical registrar for the ordered graph materialization pipeline (TB-2370).
///     Stage order: canonical objects → request cost constraints → request actors → request assumptions →
///     request quality attributes → request failure modes → cost projected-spend enrichment.
/// </summary>
public static class GraphMaterializationStages
{
    /// <summary>Documented default stage order; keep aligned with <see cref="CreateDefaultPipeline" />.</summary>
    public static readonly IReadOnlyList<string> DefaultStageOrder =
    [
        "canonical-objects",
        "request-cost-constraints",
        "request-actors",
        "declaration-identity-actors",
        "request-assumptions",
        "request-quality-attributes",
        "request-failure-modes",
        "cost-projected-spend-enrichment",
    ];

    public static GraphMaterializationPipeline CreateDefaultPipeline(IGraphNodeFactory nodeFactory)
    {
        ArgumentNullException.ThrowIfNull(nodeFactory);

        return new GraphMaterializationPipeline([
            new CanonicalObjectMaterializationStage(nodeFactory),
            new RequestCostConstraintMaterializationStage(),
            new RequestActorMaterializationStage(),
            new DeclarationIdentityActorMaterializationStage(),
            new RequestAssumptionMaterializationStage(),
            new RequestQualityAttributeMaterializationStage(),
            new RequestFailureModeMaterializationStage(),
            new CostConstraintProjectedSpendEnrichmentStage(),
        ]);
    }

    private sealed class CanonicalObjectMaterializationStage(IGraphNodeFactory nodeFactory) : IGraphMaterializationStage
    {
        public string Name => "canonical-objects";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.Snapshot.CanonicalObjects.Count == 0)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            foreach (CanonicalObject item in context.Snapshot.CanonicalObjects)
            {
                GraphNode node = nodeFactory.CreateNode(item);

                if (string.Equals(item.ObjectType, GraphNodeTypes.CostConstraint, StringComparison.OrdinalIgnoreCase))
                    context.HasCanonicalCostConstraints = true;

                if (string.Equals(item.ObjectType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                    context.HasCanonicalActors = true;

                if (string.Equals(item.ObjectType, GraphNodeTypes.Assumption, StringComparison.OrdinalIgnoreCase))
                    context.HasCanonicalAssumptions = true;

                if (string.Equals(item.ObjectType, GraphNodeTypes.QualityAttribute, StringComparison.OrdinalIgnoreCase))
                    context.HasCanonicalQualityAttributes = true;

                if (string.Equals(item.ObjectType, GraphNodeTypes.FailureMode, StringComparison.OrdinalIgnoreCase))
                    context.HasCanonicalFailureModes = true;

                if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "associatedFindings", out string? associatedFindings)
                    && associatedFindings is not null
                    && associatedFindings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
                {
                    node.Properties["WafAligned"] = "true";
                }
                else if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "findings", out string? findings)
                         && findings is not null
                         && findings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
                {
                    node.Properties["WafAligned"] = "true";
                }

                context.Nodes.Add(node);
            }

            return Task.CompletedTask;
        }
    }

    private sealed class RequestCostConstraintMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "request-cost-constraints";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalCostConstraints)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            if (!context.Snapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Constraints, out string? constraints))
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(
                RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
                    constraints,
                    context.Snapshot.SnapshotId));

            return Task.CompletedTask;
        }
    }

    private sealed class RequestActorMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "request-actors";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalActors)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            if (!context.Snapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Actors, out string? actorsJson))
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(
                RequestActorMaterializer.MaterializeFromActorsJson(
                    actorsJson,
                    context.Snapshot.SnapshotId));

            return Task.CompletedTask;
        }
    }

    private sealed class DeclarationIdentityActorMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "declaration-identity-actors";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalActors)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            IReadOnlyList<GraphNode> existingActors = context.Nodes
                .Where(static node => string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                .ToList();

            IReadOnlyList<GraphNode> materialized = DeclarationIdentityActorMaterializer.MaterializeFromNodes(
                context.Nodes,
                context.Snapshot.SnapshotId,
                existingActors);

            if (materialized.Count == 0)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(materialized);
            context.Edges.AddRange(DeclarationIdentityEdgeMaterializer.MaterializeFromDeclarationActors(materialized));

            return Task.CompletedTask;
        }
    }

    private sealed class RequestAssumptionMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "request-assumptions";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalAssumptions)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            if (!context.Snapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Assumptions, out string? assumptions))
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(
                RequestAssumptionMaterializer.MaterializeFromAssumptionsMetadata(
                    assumptions,
                    context.Snapshot.SnapshotId));

            return Task.CompletedTask;
        }
    }

    private sealed class RequestQualityAttributeMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "request-quality-attributes";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalQualityAttributes)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            if (!context.Snapshot.SourceHashes.TryGetValue(
                    ContextScopeMetadataKeys.QualityAttribute,
                    out string? qualityAttribute))
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(
                RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute(
                    qualityAttribute,
                    context.Snapshot.SnapshotId));

            return Task.CompletedTask;
        }
    }

    private sealed class RequestFailureModeMaterializationStage : IGraphMaterializationStage
    {
        public string Name => "request-failure-modes";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            if (context.HasCanonicalFailureModes)
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            if (!context.Snapshot.SourceHashes.TryGetValue(
                    ContextScopeMetadataKeys.FailureModeNote,
                    out string? failureModeNote))
            {
                context.MarkStageSkipped();
                return Task.CompletedTask;
            }

            context.Nodes.AddRange(
                RequestFailureModeMaterializer.MaterializeFromFailureModeNote(
                    failureModeNote,
                    context.Snapshot.SnapshotId));

            return Task.CompletedTask;
        }
    }

    /// <summary>TB-2348 projected-spend enrichment; runs after all materializers so topology nodes are present.</summary>
    private sealed class CostConstraintProjectedSpendEnrichmentStage : IGraphMaterializationStage
    {
        public string Name => "cost-projected-spend-enrichment";

        public Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
        {
            return CostConstraintProjectedSpendEnricher.EnrichFromTopologyAsync(context.Nodes, cancellationToken);
        }
    }
}
