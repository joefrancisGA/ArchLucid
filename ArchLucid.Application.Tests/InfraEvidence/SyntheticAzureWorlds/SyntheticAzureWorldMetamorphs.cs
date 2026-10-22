using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

/// <summary>
/// Semantics-preserving transformations for SecureNow synthetic worlds.
/// These transformations deliberately avoid calling production ranking or cut-point code.
/// </summary>
internal static class SyntheticAzureWorldMetamorphs
{
    internal static SyntheticAzureWorld ReversePathInputOrder(SyntheticAzureWorld source) =>
        Copy(source, paths: source.Paths.Reverse().ToList(), nameSuffix: "paths-reversed");

    internal static SyntheticAzureWorld RewriteEvidenceReferences(SyntheticAzureWorld source, string prefix)
    {
        IReadOnlyList<SyntheticAzurePath> paths = source.Paths
            .Select(path => new SyntheticAzurePath
            {
                PathId = path.PathId,
                PathKind = path.PathKind,
                ConfidenceBand = path.ConfidenceBand,
                CrownJewelAssertionId = path.CrownJewelAssertionId,
                Hops = path.Hops
                    .Select(hop => new SyntheticAzureHop
                    {
                        FromNodeId = hop.FromNodeId,
                        ToNodeId = hop.ToNodeId,
                        EdgeType = hop.EdgeType,
                        ProvenanceKind = hop.ProvenanceKind,
                        ConfidenceBand = hop.ConfidenceBand,
                        EvidenceReference = $"{prefix}:{hop.EvidenceReference}",
                        CloudResourceId = hop.CloudResourceId,
                        InferenceSource = hop.InferenceSource,
                    })
                    .ToList(),
            })
            .ToList();

        return Copy(source, paths, "evidence-rewritten");
    }

    internal static SyntheticAzureWorld AddDisconnectedLowLeveragePath(SyntheticAzureWorld source)
    {
        Guid pathId = Guid.Parse("10000000-0000-4000-8000-000000000399");
        SyntheticAzurePath unrelated = new()
        {
            PathId = pathId,
            PathKind = PathKind.Privilege,
            ConfidenceBand = PathConfidenceBand.Possible,
            Hops =
            [
                new SyntheticAzureHop
                {
                    FromNodeId =
                        "identity:/subscriptions/sub/resourceGroups/unrelated/providers/Microsoft.ManagedIdentity/userAssignedIdentities/unrelated-mi",
                    ToNodeId =
                        "resource:/subscriptions/sub/resourceGroups/unrelated/providers/Microsoft.Storage/storageAccounts/unrelated",
                    EdgeType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                    ConfidenceBand = PathConfidenceBand.Possible,
                    InferenceSource = "metamorphic-disconnected-control",
                    EvidenceReference = "snapshot:unrelated-disconnected-path",
                },
            ],
        };

        return Copy(source, source.Paths.Concat([unrelated]).ToList(), "disconnected-path-added");
    }

    private static SyntheticAzureWorld Copy(
        SyntheticAzureWorld source,
        IReadOnlyList<SyntheticAzurePath> paths,
        string nameSuffix) =>
        new()
        {
            Name = $"{source.Name}-{nameSuffix}",
            Paths = paths,
            ExpectedRankOrder = source.ExpectedRankOrder,
            ExpectedTopCutKey = source.ExpectedTopCutKey,
            ExpectedTopCutCollapsedPathCount = source.ExpectedTopCutCollapsedPathCount,
            RequiredEvidenceReferences = source.RequiredEvidenceReferences,
        };
}
