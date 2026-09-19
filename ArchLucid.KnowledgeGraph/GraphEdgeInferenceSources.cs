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

    public const string StructuredBriefAssumptionLink = "structured-brief-assumption-link";

    public const string InventoryExplicitParentChild = "inventory-explicit-parent-child";
    public const string InventoryRbacAssignment = "inventory-rbac-assignment";
    public const string InventoryRbacDataPlaneMap = "inventory-rbac-data-plane-map";
    public const string InventoryPublicIp = "inventory-public-ip";
    public const string InventoryPrivateEndpoint = "inventory-private-endpoint";
    public const string InventoryNicSubnet = "inventory-nic-subnet";
    public const string InventoryUsesIdentity = "inventory-uses-identity";
    public const string InventoryDiagnosticTarget = "inventory-diagnostic-target";

    public const string InventoryDiagnosticDestination = "inventory-diagnostic-destination";

    public const string InventoryEventGridDestination = "inventory-event-grid-destination";

    public const string InventoryLogicAppConnection = "inventory-logic-app-connection";

    public const string InventoryIdentityRoleAssignment = "inventory-identity-role-assignment";

    public const string InventoryAppAuthorizedAccess = "inventory-app-authorized-access";

    public const string InventoryAppKeyVaultRef = "inventory-app-key-vault-ref";

    public const string InventoryHostnameInferredTarget = "inventory-hostname-inferred-target";

    public const string InventoryServiceConnectorLink = "inventory-service-connector-link";

    public const string InventorySynapseLinkedService = "inventory-synapse-linked-service";

    public const string InventorySynapseLinkedServiceInferred = "inventory-synapse-linked-service-inferred";

    public const string InventorySynapseReadsFrom = "inventory-synapse-reads-from";

    public const string InventorySynapseWritesTo = "inventory-synapse-writes-to";

    public const string InventoryAdfTriggerSource = "inventory-adf-trigger-source";

    public const string InventoryAdfIntegrationRuntime = "inventory-adf-integration-runtime";

    public const string InventoryEventHubCapture = "inventory-event-hub-capture";

    public const string InventoryNatGatewaySubnet = "inventory-nat-gateway-subnet";

    public const string InventoryFirewallSubnet = "inventory-firewall-subnet";

    public const string InventoryFrontDoorOrigin = "inventory-front-door-origin";

    public const string InventoryContainerAppEnv = "inventory-container-app-env";

    public const string InventoryPeDnsZoneGroup = "inventory-pe-dns-zone-group";

    public const string InventoryPeReachableTarget = "inventory-pe-reachable-target";
    public const string InventoryPolicyAssignment = "inventory-policy-assignment";
    public const string InventoryNsgAllowRule = "inventory-nsg-allow-rule";

    public const string InventoryVmNic = "inventory-vm-nic";

    public const string InventoryAvdSessionHostToVm = "inventory-avd-session-host-to-vm";

    public const string InventoryNicNsg = "inventory-nic-nsg";

    public const string InventorySubnetNsg = "inventory-subnet-nsg";

    public const string InventorySubnetRouteTable = "inventory-subnet-route-table";

    public const string InventoryVnetPeering = "inventory-vnet-peering";

    public const string InventoryPeNic = "inventory-pe-nic";

    public const string InventoryPeSubnet = "inventory-pe-subnet";

    public const string InventoryAgwBackend = "inventory-agw-backend";

    public const string InventoryLbBackend = "inventory-lb-backend";

    public const string InventoryPrivateDnsVnet = "inventory-private-dns-vnet";

    public const string InventoryAppServiceSubnet = "inventory-appservice-subnet";

    public const string InventoryAdfLinkedService = "inventory-adf-linked-service";

    public const string InventoryAdfLinkedServiceInferred = "inventory-adf-linked-service-inferred";

    public const string InventoryAdfReadsFrom = "inventory-adf-reads-from";

    public const string InventoryAdfWritesTo = "inventory-adf-writes-to";

    public const string InventoryLayoutVmVnet = "inventory-layout-vm-vnet";

    public const string InventoryEffectiveNsg = "inventory-effective-nsg";

    public const string InventoryEffectiveRoutes = "inventory-effective-routes";

    public const string InventoryFederatedCredential = "inventory-federated-credential";

    public const string InventoryEntraGroupMembership = "inventory-entra-group-membership";

    public const string HumanDeclaredConnection = "human-declared-connection";

    public const string OperatorConfirmedConnection = "inventory-operator-confirmed-connection";

    public const string PimEligibilityUnknown = "pim-eligibility-unknown";

    public static bool IsInventoryAdfMovementInferenceSource(string? inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        return inferenceSource.Equals(InventoryAdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventoryAdfWritesTo, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventoryAdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventorySynapseReadsFrom, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventorySynapseWritesTo, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventorySynapseLinkedService, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase);
    }
}
