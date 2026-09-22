using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

/// <summary>
/// Manually authored SecureNow truth fixtures. Expected values are intentionally literal and are not
/// produced by the production rank/cut-point implementations under test.
/// </summary>
internal static class SyntheticAzureWorldCatalog
{
    internal static readonly Guid PublicPathId =
        Guid.Parse("10000000-0000-4000-8000-000000000301");

    internal static readonly Guid PrivatePathId =
        Guid.Parse("10000000-0000-4000-8000-000000000302");

    internal static readonly Guid SharedIdentityPath1 =
        Guid.Parse("10000000-0000-4000-8000-000000000311");

    internal static readonly Guid SharedIdentityPath2 =
        Guid.Parse("10000000-0000-4000-8000-000000000312");

    internal static readonly Guid SharedIdentityPath3 =
        Guid.Parse("10000000-0000-4000-8000-000000000313");

    internal static readonly Guid CrownJewelPathId =
        Guid.Parse("10000000-0000-4000-8000-000000000321");

    internal static readonly Guid CrownJewelAssertionId =
        Guid.Parse("20000000-0000-4000-8000-000000000321");

    internal const string SharedManagedIdentityNode =
        "identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-mi";

    internal static SyntheticAzureWorld PublicExposureVsPrivateEndpoint() =>
        new()
        {
            Name = "public-exposure-vs-private-endpoint",
            Paths =
            [
                new SyntheticAzurePath
                {
                    PathId = PublicPathId,
                    PathKind = PathKind.IntendedReachability,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    Hops =
                    [
                        Hop(
                            SecureNowArchitectConstants.InternetPublicExposureNodeId,
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app",
                            SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                            "snapshot:public-app"),
                        Hop(
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app",
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql",
                            GraphEdgeTypes.ConnectsTo,
                            "snapshot:app-to-sql"),
                    ],
                },
                new SyntheticAzurePath
                {
                    PathId = PrivatePathId,
                    PathKind = PathKind.IntendedReachability,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    Hops =
                    [
                        Hop(
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/private-app",
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/sql-pe",
                            "private-endpoint-route",
                            "snapshot:private-endpoint"),
                        Hop(
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/sql-pe",
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/private-sql",
                            GraphEdgeTypes.ConnectsTo,
                            "snapshot:private-sql"),
                    ],
                },
            ],
            ExpectedRankOrder = [PublicPathId, PrivatePathId],
            RequiredEvidenceReferences = ["snapshot:public-app", "snapshot:private-endpoint"],
        };

    internal static SyntheticAzureWorld SharedManagedIdentityCutPoint() =>
        new()
        {
            Name = "shared-managed-identity-cut-point",
            Paths =
            [
                PrivilegePath(SharedIdentityPath1, "keyvault", "snapshot:mi-kv"),
                PrivilegePath(SharedIdentityPath2, "sql", "snapshot:mi-sql"),
                PrivilegePath(SharedIdentityPath3, "storage", "snapshot:mi-storage"),
            ],
            ExpectedTopCutKey = $"node:{SharedManagedIdentityNode}",
            ExpectedTopCutCollapsedPathCount = 3,
            RequiredEvidenceReferences = ["snapshot:mi-kv", "snapshot:mi-sql", "snapshot:mi-storage"],
        };

    internal static SyntheticAzureWorld CrownJewelConsequence() =>
        new()
        {
            Name = "crown-jewel-consequence",
            Paths =
            [
                new SyntheticAzurePath
                {
                    PathId = CrownJewelPathId,
                    PathKind = PathKind.Privilege,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    CrownJewelAssertionId = CrownJewelAssertionId,
                    Hops =
                    [
                        Hop(
                            SharedManagedIdentityNode,
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/patient-secrets",
                            GraphEdgeTypes.CanWrite,
                            "snapshot:crown-jewel-write"),
                    ],
                },
                new SyntheticAzurePath
                {
                    PathId = PrivatePathId,
                    PathKind = PathKind.Privilege,
                    ConfidenceBand = PathConfidenceBand.Confirmed,
                    Hops =
                    [
                        Hop(
                            "identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker-mi",
                            "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/logs",
                            GraphEdgeTypes.CanWrite,
                            "snapshot:ordinary-write"),
                    ],
                },
            ],
            ExpectedRankOrder = [CrownJewelPathId, PrivatePathId],
        };

    internal static SyntheticAzureWorld InsufficientEvidenceMustStayWeakest() =>
        new()
        {
            Name = "insufficient-evidence-confidence",
            Paths =
            [
                new SyntheticAzurePath
                {
                    PathId = PublicPathId,
                    PathKind = PathKind.IntendedReachability,
                    ConfidenceBand = PathConfidenceBand.InsufficientEvidence,
                    Hops =
                    [
                        new SyntheticAzureHop
                        {
                            FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
                            ToNodeId = "resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/unknown-app",
                            EdgeType = SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType,
                            ProvenanceKind = ProvenanceKind.DeterministicInference,
                            ConfidenceBand = PathConfidenceBand.InsufficientEvidence,
                            InferenceSource = "synthetic-oracle-missing-nsg",
                            EvidenceReference = "snapshot:missing-nsg",
                        },
                    ],
                },
            ],
            RequiredEvidenceReferences = ["snapshot:missing-nsg"],
        };

    private static SyntheticAzurePath PrivilegePath(Guid pathId, string terminal, string evidence) =>
        new()
        {
            PathId = pathId,
            PathKind = PathKind.Privilege,
            ConfidenceBand = PathConfidenceBand.Confirmed,
            Hops =
            [
                Hop(
                    SharedManagedIdentityNode,
                    $"resource:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Test/{terminal}",
                    GraphEdgeTypes.CanWrite,
                    evidence),
            ],
        };

    private static SyntheticAzureHop Hop(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string evidenceReference) =>
        new()
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            ConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = evidenceReference,
        };
}
