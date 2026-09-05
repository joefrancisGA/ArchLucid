using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Wave-10 suggestion 96: cross-run prior graph must match the prior run's create-time pin fingerprints.
/// </summary>
public static partial class CrossRunDiffFindingPriorGuard
{
    public static void EnsurePriorGraphPinFingerprintsMatchOrThrow(
        FindingAnalysisContext? analysisContext,
        GraphSnapshot? priorGraph,
        string engineType)
    {
        if (analysisContext?.Prior?.PriorGraphSnapshotId is not Guid priorGraphId || priorGraphId == Guid.Empty)
            return;

        if (priorGraph is null)
            return;

        GraphNode? contextNode = priorGraph.Nodes
            .FirstOrDefault(node => string.Equals(node.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        if (contextNode?.Properties is null)
        {
            throw new InvalidOperationException(
                $"Cross-run engine '{engineType}' requires prior graph snapshot '{priorGraphId:D}' to carry create-time pin fingerprints.");
        }

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.PolicyPackPinsHashSha256Hex,
            analysisContext.Prior.PriorPinnedPolicyPackIdsHashSha256Hex,
            engineType,
            priorGraphId,
            "policy pack pin hash");

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.EvidencePackagePinsHashSha256Hex,
            analysisContext.Prior.PriorPinnedEvidencePackagePinsHashSha256Hex,
            engineType,
            priorGraphId,
            "evidence package pin hash");

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.ArchitectureVersionContentHashSha256Hex,
            analysisContext.Prior.PriorPinnedArchitectureVersionContentHashSha256Hex,
            engineType,
            priorGraphId,
            "architecture version content hash");

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.KnowledgeModelContentHashSha256Hex,
            analysisContext.Prior.PriorPinnedKnowledgeModelContentHashSha256Hex,
            engineType,
            priorGraphId,
            "knowledge model content hash");

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.FocusedPilotModeEnabled,
            analysisContext.Prior.PriorPinnedFocusedPilotModeEnabled,
            engineType,
            priorGraphId,
            "focused pilot mode pin");

        EnsureGraphPropertyMatchesPriorHeaderOrThrow(
            contextNode.Properties,
            ContextGraphPropertyKeys.FocusedPilotCloudProvider,
            analysisContext.Prior.PriorPinnedFocusedPilotCloudProvider,
            engineType,
            priorGraphId,
            "focused pilot cloud provider pin");
    }

    private static void EnsureGraphPropertyMatchesPriorHeaderOrThrow(
        IReadOnlyDictionary<string, string> graphProperties,
        string propertyKey,
        string? expectedHex,
        string engineType,
        Guid priorGraphId,
        string label)
    {
        if (string.IsNullOrWhiteSpace(expectedHex))
            return;

        if (!graphProperties.TryGetValue(propertyKey, out string? actualHex)
            || !string.Equals(actualHex, expectedHex, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Cross-run engine '{engineType}' requires prior graph snapshot '{priorGraphId:D}' {label} fingerprint to match the prior run header pin.");
        }
    }
}
