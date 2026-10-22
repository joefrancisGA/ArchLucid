using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Stamps orchestration context onto the graph context node for engines and reuse validators.
/// </summary>
public static class FindingAnalysisContextGraphStamp
{
    public static void Stamp(GraphSnapshot graphSnapshot, FindingAnalysisContext context)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(context);

        GraphNode? contextNode = graphSnapshot.Nodes
            .FirstOrDefault(node => string.Equals(node.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return;

        contextNode.Properties ??= new Dictionary<string, string>(StringComparer.Ordinal);

        if (!string.IsNullOrEmpty(context.ContextCanonicalFingerprint))
        {
            contextNode.Properties[ContextGraphPropertyKeys.ContextCanonicalFingerprint] =
                context.ContextCanonicalFingerprint;
        }

        if (!string.IsNullOrEmpty(context.KnowledgeModelFingerprint))
        {
            contextNode.Properties[ContextGraphPropertyKeys.KnowledgeModelFingerprint] =
                context.KnowledgeModelFingerprint;
        }

        if (context.ArchitectureVersionId is Guid versionId && versionId != Guid.Empty)
        {
            contextNode.Properties[ContextGraphPropertyKeys.ArchitectureVersionId] = versionId.ToString("D");
        }

        if (context.Prior?.PriorArchitectureVersionId is Guid priorVersionId && priorVersionId != Guid.Empty)
        {
            contextNode.Properties[ContextGraphPropertyKeys.PriorArchitectureVersionId] = priorVersionId.ToString("D");
        }

        if (context.Prior?.PriorGraphSnapshotId is Guid priorGraphId && priorGraphId != Guid.Empty)
        {
            contextNode.Properties[ContextGraphPropertyKeys.PriorGraphSnapshotId] = priorGraphId.ToString("D");
        }

        if (context.EnabledPolicyPackIds.Count > 0)
        {
            contextNode.Properties[ContextGraphPropertyKeys.EnabledPolicyPackIds] = string.Join(
                '|',
                context.EnabledPolicyPackIds.OrderBy(static id => id, StringComparer.OrdinalIgnoreCase));
        }
    }
}
