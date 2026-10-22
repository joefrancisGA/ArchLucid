namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resource categories whose indirect relationships NR-04 resolves from cited evidence.</summary>
public enum InventoryDiagramIndirectRelationshipCategory
{
    KeyVault = 0,
    StorageAccount = 1,
    Registry = 2,
    PrivateLinkScope = 3,
    NetworkSecurityPerimeter = 4,
    NetGateway = 5,
    LoadBalancer = 6,
    BastionHost = 7,
    AzureFirewall = 8,
    VirtualMachine = 9,
    VirtualMachineScaleSet = 10,
    KubernetesCluster = 11,
    MySql = 12,
    RedisCache = 13,
    Grafana = 14,
    FabricCapacity = 15,
    StaticSite = 16,
    HostPool = 17,
}
