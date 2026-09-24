using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Versioned catalog of <c>network-associations.json</c> <c>associationType</c> values (IE-RF-01).
/// </summary>
public static class AzureInventoryRelationshipAssociationTypes
{
    public const string NicToSubnet = "nicToSubnet";

    public const string PublicIpToNic = "publicIpToNic";

    public const string PrivateEndpointTarget = "privateEndpointTarget";

    /// <summary>
    ///     Storage service-tag heuristic from NSG rules — not an ARM association id; stays DeterministicInference.
    /// </summary>
    public const string NsgAllowRule = "nsgAllowRule";

    public const string VmToNic = "vmToNic";

    public const string NicToNsg = "nicToNsg";

    public const string SubnetToNsg = "subnetToNsg";

    public const string SubnetToRouteTable = "subnetToRouteTable";

    public const string VnetPeering = "vnetPeering";

    public const string PeToNic = "peToNic";

    public const string PeToSubnet = "peToSubnet";

    public const string AgwToBackend = "agwToBackend";

    public const string LbToBackend = "lbToBackend";

    public const string PrivateDnsVnetLink = "privateDnsVnetLink";

    public const string AppServiceToSubnet = "appServiceToSubnet";

    public const string AdfLinkedService = "adfLinkedService";

    public const string AdfLinkedServiceInferred = "adfLinkedServiceInferred";

    public const string AdfReadsFrom = "adfReadsFrom";

    public const string AdfWritesTo = "adfWritesTo";

    public const string DiagnosticToDestination = "diagnosticToDestination";

    public const string EventGridToDestination = "eventGridToDestination";

    public const string LogicAppConnection = "logicAppConnection";

    public const string IdentityToRoleAssignment = "identityToRoleAssignment";

    public const string AppAuthorizedAccess = "appAuthorizedAccess";

    /// <summary>Log Analytics observed app→target dependency (SN-RT-07).</summary>
    public const string ObservedDependency = "observedDependency";

    /// <summary>Entra principal membership in SQL database (SN-RT-08).</summary>
    public const string SqlDatabasePrincipal = "sqlDatabasePrincipal";

    public const string AppToKeyVaultRef = "appToKeyVaultRef";

    public const string HostnameInferredTarget = "hostnameInferredTarget";

    public const string OperatorConfirmedConnection = "operatorConfirmedConnection";

    public const string ServiceConnectorLink = "serviceConnectorLink";

    public const string SynapseLinkedService = "synapseLinkedService";

    public const string SynapseLinkedServiceInferred = "synapseLinkedServiceInferred";

    public const string SynapseReadsFrom = "synapseReadsFrom";

    public const string SynapseWritesTo = "synapseWritesTo";

    public const string AdfTriggerSource = "adfTriggerSource";

    public const string AdfIntegrationRuntime = "adfIntegrationRuntime";

    public const string EventHubCapture = "eventHubCapture";

    public const string NatGatewayToSubnet = "natGatewayToSubnet";

    public const string FirewallToSubnet = "firewallToSubnet";

    public const string FrontDoorToOrigin = "frontDoorToOrigin";

    public const string ContainerAppToEnv = "containerAppToEnv";

    public const string PeDnsZoneGroup = "peDnsZoneGroup";

    /// <summary>
    ///     Composed compute → store hop when private DNS proves reachability (SN-PE-04). Never ObservedFact.
    /// </summary>
    public const string PeReachableTarget = "peReachableTarget";

    public const string AvdSessionHostToVm = "avdSessionHostToVm";

    public const string RecoveryServicesProtects = "recoveryServicesProtects";

    public const string RecoveryServicesReplicates = "recoveryServicesReplicates";

    private static readonly AzureInventoryRelationshipAssociationTypeDefinition[] Catalog =
    [
        Observed(NicToSubnet, AzureInventoryRelationshipArmKind.NetworkInterface, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-nic-subnet"),
        Observed(PublicIpToNic, AzureInventoryRelationshipArmKind.PublicIpAddress, AzureInventoryRelationshipArmKind.NetworkInterface, "EXPOSES", "inventory-public-ip"),
        Observed(PrivateEndpointTarget, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.BackendPoolMember, "CONNECTS_TO", "inventory-private-endpoint"),
        // nsgAllowRule is a subnet→storage heuristic from NSG rule text, not a cited ARM association id.
        Inferred(NsgAllowRule, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.StorageAccount, "ROUTES_TO", "inventory-nsg-allow-rule", ProvenanceKind.DeterministicInference),
        Observed(VmToNic, AzureInventoryRelationshipArmKind.VirtualMachine, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-vm-nic"),
        Observed(NicToNsg, AzureInventoryRelationshipArmKind.NetworkInterface, AzureInventoryRelationshipArmKind.NetworkSecurityGroup, "APPLIES_TO", "inventory-nic-nsg"),
        Observed(SubnetToNsg, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.NetworkSecurityGroup, "APPLIES_TO", "inventory-subnet-nsg"),
        Observed(SubnetToRouteTable, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.RouteTable, "APPLIES_TO", "inventory-subnet-route-table"),
        Observed(VnetPeering, AzureInventoryRelationshipArmKind.VirtualNetwork, AzureInventoryRelationshipArmKind.VirtualNetwork, "PEERS_WITH", "inventory-vnet-peering"),
        Observed(PeToNic, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-pe-nic"),
        Observed(PeToSubnet, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-pe-subnet"),
        Observed(AgwToBackend, AzureInventoryRelationshipArmKind.ApplicationGateway, AzureInventoryRelationshipArmKind.BackendPoolMember, "CONNECTS_TO", "inventory-agw-backend"),
        Observed(LbToBackend, AzureInventoryRelationshipArmKind.LoadBalancer, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-lb-backend"),
        Observed(PrivateDnsVnetLink, AzureInventoryRelationshipArmKind.PrivateDnsZone, AzureInventoryRelationshipArmKind.VirtualNetwork, "CONNECTS_TO", "inventory-private-dns-vnet"),
        Observed(AppServiceToSubnet, AzureInventoryRelationshipArmKind.AppService, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-appservice-subnet"),
        Observed(AdfLinkedService, AzureInventoryRelationshipArmKind.DataFactory, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-adf-linked-service"),
        Inferred(AdfLinkedServiceInferred, AzureInventoryRelationshipArmKind.DataFactory, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-adf-linked-service-inferred", ProvenanceKind.DeterministicInference),
        Inferred(AdfReadsFrom, AzureInventoryRelationshipArmKind.DataFactory, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CAN_READ", "inventory-adf-reads-from", ProvenanceKind.DerivedFact),
        Inferred(AdfWritesTo, AzureInventoryRelationshipArmKind.DataFactory, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CAN_WRITE", "inventory-adf-writes-to", ProvenanceKind.DerivedFact),
        Observed(DiagnosticToDestination, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.DiagnosticDestination, "CONNECTS_TO", "inventory-diagnostic-destination"),
        Observed(EventGridToDestination, AzureInventoryRelationshipArmKind.EventGridTopic, AzureInventoryRelationshipArmKind.DiagnosticDestination, "CONNECTS_TO", "inventory-event-grid-destination"),
        Inferred(LogicAppConnection, AzureInventoryRelationshipArmKind.LogicApp, AzureInventoryRelationshipArmKind.ServiceConnectorTarget, "CONNECTS_TO", "inventory-logic-app-connection", ProvenanceKind.DerivedFact),
        Observed(IdentityToRoleAssignment, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.Compute, "USES_IDENTITY", "inventory-identity-role-assignment"),
        Inferred(AppAuthorizedAccess, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "MAY_ACCESS", "inventory-app-authorized-access", ProvenanceKind.DerivedFact),
        Observed(ObservedDependency, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-observed-dependency"),
        Inferred(SqlDatabasePrincipal, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "MAY_ACCESS", "inventory-sql-database-principal", ProvenanceKind.DerivedFact),
        Inferred(AppToKeyVaultRef, AzureInventoryRelationshipArmKind.AppService, AzureInventoryRelationshipArmKind.KeyVault, "CONNECTS_TO", "inventory-app-key-vault-ref", ProvenanceKind.DerivedFact),
        Inferred(HostnameInferredTarget, AzureInventoryRelationshipArmKind.AppService, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-hostname-inferred-target", ProvenanceKind.DeterministicInference),
        Inferred(OperatorConfirmedConnection, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-operator-confirmed-connection", ProvenanceKind.HumanAssertion),
        Observed(ServiceConnectorLink, AzureInventoryRelationshipArmKind.AppService, AzureInventoryRelationshipArmKind.ServiceConnectorTarget, "CONNECTS_TO", "inventory-service-connector-link"),
        Observed(SynapseLinkedService, AzureInventoryRelationshipArmKind.SynapseWorkspace, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-synapse-linked-service"),
        Inferred(SynapseLinkedServiceInferred, AzureInventoryRelationshipArmKind.SynapseWorkspace, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-synapse-linked-service-inferred", ProvenanceKind.DeterministicInference),
        Inferred(SynapseReadsFrom, AzureInventoryRelationshipArmKind.SynapseWorkspace, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CAN_READ", "inventory-synapse-reads-from", ProvenanceKind.DerivedFact),
        Inferred(SynapseWritesTo, AzureInventoryRelationshipArmKind.SynapseWorkspace, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CAN_WRITE", "inventory-synapse-writes-to", ProvenanceKind.DerivedFact),
        Observed(AdfTriggerSource, AzureInventoryRelationshipArmKind.LinkedServiceTarget, AzureInventoryRelationshipArmKind.DataFactory, "CONNECTS_TO", "inventory-adf-trigger-source"),
        Observed(AdfIntegrationRuntime, AzureInventoryRelationshipArmKind.DataFactory, AzureInventoryRelationshipArmKind.IntegrationRuntime, "CONNECTS_TO", "inventory-adf-integration-runtime"),
        Observed(EventHubCapture, AzureInventoryRelationshipArmKind.EventHub, AzureInventoryRelationshipArmKind.StorageAccount, "CONNECTS_TO", "inventory-event-hub-capture"),
        Observed(NatGatewayToSubnet, AzureInventoryRelationshipArmKind.NatGateway, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-nat-gateway-subnet"),
        Observed(FirewallToSubnet, AzureInventoryRelationshipArmKind.AzureFirewall, AzureInventoryRelationshipArmKind.Subnet, "PROTECTS", "inventory-firewall-subnet"),
        Observed(FrontDoorToOrigin, AzureInventoryRelationshipArmKind.FrontDoor, AzureInventoryRelationshipArmKind.BackendPoolMember, "CONNECTS_TO", "inventory-front-door-origin"),
        Observed(ContainerAppToEnv, AzureInventoryRelationshipArmKind.ContainerApp, AzureInventoryRelationshipArmKind.ContainerAppEnvironment, "CONNECTS_TO", "inventory-container-app-env"),
        Observed(PeDnsZoneGroup, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.PrivateDnsZone, "CONNECTS_TO", "inventory-pe-dns-zone-group"),
        Inferred(PeReachableTarget, AzureInventoryRelationshipArmKind.Compute, AzureInventoryRelationshipArmKind.LinkedServiceTarget, "CONNECTS_TO", "inventory-pe-reachable-target", ProvenanceKind.DerivedFact),
        Observed(
            AvdSessionHostToVm,
            AzureInventoryRelationshipArmKind.VirtualDesktopSessionHost,
            AzureInventoryRelationshipArmKind.VirtualMachine,
            "CONNECTS_TO",
            "inventory-avd-session-host-to-vm"),
        Observed(
            RecoveryServicesProtects,
            AzureInventoryRelationshipArmKind.RecoveryServicesVault,
            AzureInventoryRelationshipArmKind.VirtualMachine,
            "PROTECTS",
            "inventory-recovery-services-protects"),
        Observed(
            RecoveryServicesReplicates,
            AzureInventoryRelationshipArmKind.RecoveryServicesVault,
            AzureInventoryRelationshipArmKind.VirtualMachine,
            "PROTECTS",
            "inventory-recovery-services-replicates"),
    ];

    private static readonly Dictionary<string, AzureInventoryRelationshipAssociationTypeDefinition> Lookup =
        Catalog.ToDictionary(definition => definition.AssociationType, StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyList<AzureInventoryRelationshipAssociationTypeDefinition> All => Catalog;

    public static bool IsKnown(string? associationType)
    {
        if (string.IsNullOrWhiteSpace(associationType))
        {
            return false;
        }

        return Lookup.ContainsKey(associationType);
    }

    public static bool TryGet(
        string? associationType,
        out AzureInventoryRelationshipAssociationTypeDefinition? definition)
    {
        definition = null;

        if (string.IsNullOrWhiteSpace(associationType))
        {
            return false;
        }

        if (!Lookup.TryGetValue(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? found))
        {
            return false;
        }

        definition = found;

        return true;
    }

    public static bool IsVnetPeeringRelationship(string? relationshipType, string? inferenceSource)
    {
        if (!TryGet(VnetPeering, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(relationshipType)
            && (relationshipType.Equals(definition.AssociationType, StringComparison.OrdinalIgnoreCase)
                || relationshipType.Equals(definition.DefaultGraphEdgeType, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(inferenceSource)
            && inferenceSource.Equals(definition.DefaultInferenceSource, StringComparison.OrdinalIgnoreCase);
    }

    private static AzureInventoryRelationshipAssociationTypeDefinition Observed(
        string associationType,
        AzureInventoryRelationshipArmKind fromArmKind,
        AzureInventoryRelationshipArmKind toArmKind,
        string graphEdgeType,
        string inferenceSource)
    {
        return Inferred(
            associationType,
            fromArmKind,
            toArmKind,
            graphEdgeType,
            inferenceSource,
            ProvenanceKind.ObservedFact);
    }

    private static AzureInventoryRelationshipAssociationTypeDefinition Inferred(
        string associationType,
        AzureInventoryRelationshipArmKind fromArmKind,
        AzureInventoryRelationshipArmKind toArmKind,
        string graphEdgeType,
        string inferenceSource,
        ProvenanceKind provenanceKind)
    {
        return new AzureInventoryRelationshipAssociationTypeDefinition
        {
            AssociationType = associationType,
            FromArmKind = fromArmKind,
            ToArmKind = toArmKind,
            DefaultProvenanceKind = provenanceKind,
            DefaultGraphEdgeType = graphEdgeType,
            DefaultInferenceSource = inferenceSource,
        };
    }
}
