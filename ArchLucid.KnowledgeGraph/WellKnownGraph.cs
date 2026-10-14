namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Canonical <see cref="Models.GraphNode.NodeType" /> values produced by the default builder and inferrer.
/// </summary>
public static class GraphNodeTypes
{
    public const string ContextSnapshot = "ContextSnapshot";
    public const string TopologyResource = "TopologyResource";
    public const string SecurityBaseline = "SecurityBaseline";
    public const string PolicyControl = "PolicyControl";
    public const string Requirement = "Requirement";

    public const string CostConstraint = "CostConstraint";

    public const string Actor = "Actor";

    public const string TrustBoundary = "TrustBoundary";

    public const string Assumption = "Assumption";

    public const string QualityAttribute = "QualityAttribute";

    public const string FailureMode = "FailureMode";
}

/// <summary>
///     Canonical <see cref="Models.GraphEdge.EdgeType" /> values inferred by
///     <see cref="Inference.DefaultGraphEdgeInferer" />.
/// </summary>
public static class GraphEdgeTypes
{
    public const string Contains = "CONTAINS";
    public const string ContainsResource = "CONTAINS_RESOURCE";
    public const string Protects = "PROTECTS";
    public const string AppliesTo = "APPLIES_TO";
    public const string RelatesTo = "RELATES_TO";

    public const string ConnectsTo = "CONNECTS_TO";

    public const string DependsOn = "DEPENDS_ON";

    public const string Exposes = "EXPOSES";

    public const string HasRole = "HAS_ROLE";

    public const string UsesIdentity = "USES_IDENTITY";

    public const string CanRead = "CAN_READ";

    public const string CanWrite = "CAN_WRITE";

    public const string CanAssume = "CAN_ASSUME";

    /// <summary>Control-plane code deployment onto an App Service or Function App (book Ch. 5 <c>canControlCode</c>).</summary>
    public const string CanControlCode = "CAN_CONTROL_CODE";

    /// <summary>Principal may add a credential and sign in as the target application (book Ch. 4 §4.3 <c>canAddCredential</c>).</summary>
    public const string CanAddCredential = "CAN_ADD_CREDENTIAL";

    /// <summary>Principal may grant a role or directory permission that creates downstream access (book Ch. 4 §4.4).</summary>
    public const string CanGrantRole = "CAN_GRANT_ROLE";

    public const string RoutesTo = "ROUTES_TO";

    /// <summary>CI federated credential adapter edge (SA-19); emitted when optional ZIP sibling is present.</summary>
    public const string FederatesAs = "FEDERATES_AS";

    /// <summary>Entra group membership adapter edge (SA-20); emitted when optional ZIP sibling or Graph GET is present.</summary>
    public const string MemberOf = "MEMBER_OF";

    /// <summary>VNet peering adapter edge (IE-RF-07); peering is not a generic CONNECTS_TO hop.</summary>
    public const string PeersWith = "PEERS_WITH";

    /// <summary>MI + RBAC composed authorization hop (AX-DE-03); not confirmed data-plane traffic.</summary>
    public const string MayAccess = "MAY_ACCESS";

    /// <summary>Derived network reachability between a position/workload and an endpoint (book Ch. 5–7 <c>canReach</c>).</summary>
    public const string CanReach = "CAN_REACH";
}

/// <summary>
///     Typical <see cref="Models.GraphNode.Category" /> values for topology resources (enrichment / heuristics).
/// </summary>
public static class GraphTopologyCategories
{
    public const string Network = "network";
    public const string Storage = "storage";
    public const string Compute = "compute";
    public const string Data = "data";

    public const string Identity = "identity";
}
