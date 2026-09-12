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
}
