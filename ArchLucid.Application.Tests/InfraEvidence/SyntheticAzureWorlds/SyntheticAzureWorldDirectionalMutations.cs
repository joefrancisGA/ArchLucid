using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

/// <summary>
/// Security-relevant mutations for directional SecureNow tests.
/// These helpers do not call production ranking or cut-point code.
/// </summary>
internal static class SyntheticAzureWorldDirectionalMutations
{
    internal static SyntheticAzurePath AddPublicIngress(SyntheticAzurePath source)
    {
        SyntheticAzureHop firstHop = source.Hops[0];

        return CopyPath(
            source,
            hops:
            [
                new SyntheticAzureHop
                {
                    FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
                    ToNodeId = firstHop.FromNodeId,
                    EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    EvidenceReference = "mutation:public-ingress",
                },
                .. source.Hops,
            ]);
    }

    internal static SyntheticAzurePath AddPrivateEndpointRoute(SyntheticAzurePath source)
    {
        SyntheticAzureHop lastHop = source.Hops[^1];

        return CopyPath(
            source,
            hops:
            [
                .. source.Hops,
                new SyntheticAzureHop
                {
                    FromNodeId = lastHop.ToNodeId,
                    ToNodeId = "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/mutation-pe",
                    EdgeType = "private-endpoint-route",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    EvidenceReference = "mutation:private-endpoint",
                },
            ]);
    }

    internal static SyntheticAzurePath RemovePublicExposure(SyntheticAzurePath source) =>
        CopyPath(
            source,
            hops: source.Hops
                .Where(hop =>
                    !hop.FromNodeId.Equals(
                        SecureNowArchitectConstants.InternetPublicExposureNodeId,
                        StringComparison.Ordinal))
                .ToList());

    internal static SyntheticAzurePath WithActionEdge(SyntheticAzurePath source, string edgeType) =>
        CopyPath(
            source,
            hops: source.Hops
                .Select(hop => new SyntheticAzureHop
                {
                    FromNodeId = hop.FromNodeId,
                    ToNodeId = hop.ToNodeId,
                    EdgeType = edgeType,
                    ProvenanceKind = hop.ProvenanceKind,
                    ConfidenceBand = hop.ConfidenceBand,
                    EvidenceReference = hop.EvidenceReference,
                    CloudResourceId = hop.CloudResourceId,
                    InferenceSource = hop.InferenceSource,
                })
                .ToList());

    internal static SyntheticAzureWorld ReplaceSharedIdentityOnTwoPaths(SyntheticAzureWorld source)
    {
        IReadOnlyList<SyntheticAzurePath> paths = source.Paths
            .Select((path, index) => index < 2
                ? CopyPath(
                    path,
                    pathId: path.PathId,
                    hops: path.Hops
                        .Select(hop => new SyntheticAzureHop
                        {
                            FromNodeId = hop.FromNodeId == SyntheticAzureWorldCatalog.SharedManagedIdentityNode
                                ? $"identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mutation-mi-{index + 1}"
                                : hop.FromNodeId,
                            ToNodeId = hop.ToNodeId,
                            EdgeType = hop.EdgeType,
                            ProvenanceKind = hop.ProvenanceKind,
                            ConfidenceBand = hop.ConfidenceBand,
                            EvidenceReference = hop.EvidenceReference,
                            CloudResourceId = hop.CloudResourceId,
                            InferenceSource = hop.InferenceSource,
                        })
                        .ToList())
                : path)
            .ToList();

        return new SyntheticAzureWorld
        {
            Name = $"{source.Name}-shared-identity-replaced",
            Paths = paths,
            ExpectedRankOrder = source.ExpectedRankOrder,
            ExpectedTopCutKey = source.ExpectedTopCutKey,
            ExpectedTopCutCollapsedPathCount = 1,
            RequiredEvidenceReferences = source.RequiredEvidenceReferences,
        };
    }

    private static SyntheticAzurePath CopyPath(
        SyntheticAzurePath source,
        IReadOnlyList<SyntheticAzureHop> hops,
        Guid? pathId = null) =>
        new()
        {
            PathId = pathId ?? source.PathId,
            PathKind = source.PathKind,
            ConfidenceBand = source.ConfidenceBand,
            CrownJewelAssertionId = source.CrownJewelAssertionId,
            Hops = hops,
        };
}
