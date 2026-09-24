namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     ARM resource kind for one end of a <c>network-associations.json</c> row (IE-RF-01).
/// </summary>
public enum AzureInventoryRelationshipArmKind
{
    NetworkInterface = 0,
    Subnet = 1,
    PublicIpAddress = 2,
    PrivateEndpoint = 3,
    VirtualMachine = 4,
    NetworkSecurityGroup = 5,
    RouteTable = 6,
    VirtualNetwork = 7,
    ApplicationGateway = 8,
    LoadBalancer = 9,
    PrivateDnsZone = 10,
    AppService = 11,
    StorageAccount = 12,
    BackendPoolMember = 13,
    DataFactory = 14,
    LinkedServiceTarget = 15,

    /// <summary>App Service, Function, VM, VMSS, Container App, AKS, ADF, Databricks — compute with MI.</summary>
    Compute = 16,

    /// <summary>Log Analytics workspace, storage account, or Event Hub diagnostic sink.</summary>
    DiagnosticDestination = 17,

    EventGridTopic = 18,
    LogicApp = 19,
    MessagingNamespace = 20,
    DatabricksWorkspace = 21,
    ServiceConnectorTarget = 22,
    IntegrationRuntime = 23,

    /// <summary>Synapse workspace — factory cousin for linked-service edges (AX-DE).</summary>
    SynapseWorkspace = 24,
    KeyVault = 25,
    NatGateway = 26,
    AzureFirewall = 27,
    FrontDoor = 28,
    ContainerApp = 29,
    ContainerAppEnvironment = 30,
    EventHub = 31,

    /// <summary>AVD host pool session host child resource.</summary>
    VirtualDesktopSessionHost = 32,

    /// <summary>Recovery Services vault (RSV-03).</summary>
    RecoveryServicesVault = 33,
}
