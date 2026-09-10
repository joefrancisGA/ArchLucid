namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Values for <see cref="Models.GraphEdge.InferenceSource" /> set by <see cref="Inference.DefaultGraphEdgeInferer" />.
/// </summary>
public static class GraphEdgeInferenceSources
{
    public const string ContextMembership = "context-membership";
    public const string ExplicitParentChild = "explicit-parent-child";
    public const string HeuristicNetworkSubnet = "heuristic-network-subnet";
    public const string PolicyTargeted = "policy-targeted-topology";
    public const string PolicySingleTopologyFallback = "policy-single-topology-fallback";
    public const string RequirementTargeted = "requirement-targeted-topology";
    public const string RequirementSingleTopologyFallback = "requirement-single-topology-fallback";
    public const string RequirementTextHeuristic = "requirement-text-heuristic";
    public const string SecurityTargeted = "security-targeted-topology";
    public const string SecuritySingleTopologyFallback = "security-single-topology-fallback";
    public const string TopologyDependsOn = "topology-depends-on";
    public const string TopologyConnectsTo = "topology-connects-to";
    public const string TopologyExposes = "topology-exposes";
    public const string AgentProposalRelationship = "agent-proposal-relationship";
    public const string DeclarationIdentityActorLink = "declaration-identity-actor-link";
    public const string DeclarationIdentityIamPath = "declaration-identity-iam-path";
    public const string DeclarationIdentityDataFlowPath = "declaration-identity-data-flow-path";
    public const string DeclarationSegmentationPath = "declaration-segmentation-path";
    public const string StructuredParse = "structured-parse";

    public const string InventoryExplicitParentChild = "inventory-explicit-parent-child";
    public const string InventoryRbacAssignment = "inventory-rbac-assignment";
    public const string InventoryRbacDataPlaneMap = "inventory-rbac-data-plane-map";
    public const string InventoryPublicIp = "inventory-public-ip";
    public const string InventoryPrivateEndpoint = "inventory-private-endpoint";
    public const string InventoryNicSubnet = "inventory-nic-subnet";
    public const string InventoryUsesIdentity = "inventory-uses-identity";
    public const string InventoryDiagnosticTarget = "inventory-diagnostic-target";
    public const string InventoryPolicyAssignment = "inventory-policy-assignment";
    public const string InventoryNsgAllowRule = "inventory-nsg-allow-rule";

    public const string InventoryFederatedCredential = "inventory-federated-credential";
}
