using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureInventoryNsgAllowRuleBuilderTests
{
    [Fact]
    public void Build_emits_storage_service_tag_allow_rule_from_subnet_to_storage_account()
    {
        HostedAzureArmResourceRecord nsg = new(
            ResourceType: "Microsoft.Network/networkSecurityGroups",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
            Name: "nsg1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["securityRules"] =
                    """
                    [
                      {
                        "name": "AllowStorageInbound",
                        "properties": {
                          "access": "Allow",
                          "direction": "Inbound",
                          "destinationAddressPrefix": "Storage"
                        }
                      }
                    ]
                    """,
            });

        HostedAzureArmResourceRecord vnet = new(
            ResourceType: "Microsoft.Network/virtualNetworks",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
            Name: "vnet1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>
            {
                ["subnets"] =
                    """
                    [
                      {
                        "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default",
                        "properties": {
                          "networkSecurityGroup": {
                            "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1"
                          }
                        }
                      }
                    ]
                    """,
            });

        HostedAzureArmResourceRecord storageAccount = new(
            ResourceType: "Microsoft.Storage/storageAccounts",
            ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            Name: "sa1",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>());

        IReadOnlyList<HostedAzureArmNetworkAssociationRecord> rows =
            HostedAzureInventoryNsgAllowRuleBuilder.Build([nsg, vnet, storageAccount]);

        Assert.Single(rows);
        Assert.Equal("nsgAllowRule", rows[0].AssociationType);
        Assert.Equal("AllowStorageInbound", rows[0].RuleName);
        Assert.Contains("subnets/default", rows[0].FromResourceId, StringComparison.Ordinal);
        Assert.Equal(storageAccount.ResourceId, rows[0].ToResourceId);
    }
}
