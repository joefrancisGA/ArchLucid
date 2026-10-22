using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfIntegrationRuntimeSanitizerTests
{
    private const string FactoryId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    private const string SubnetId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/adf";

    [Fact]
    public void TrySanitizeFromArmResource_reads_subnet_id_from_compute_vnet_properties()
    {
        // Data Factory 2018-06-01 nests a managed IR subnet under computeProperties.vNetProperties.
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/integrationruntimes/managed",
              "name": "managed",
              "properties": {
                "type": "Managed",
                "typeProperties": {
                  "computeProperties": {
                    "location": "eastus",
                    "vNetProperties": {
                      "vNetId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
                      "subnet": "adf",
                      "subnetId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/adf"
                    }
                  }
                }
              }
            }
            """);

        bool parsed = AzureInventoryAdfIntegrationRuntimeSanitizer.TrySanitizeFromArmResource(
            FactoryId,
            document.RootElement,
            out AzureInventoryAdfIntegrationRuntimeRow? row);

        parsed.Should().BeTrue();
        row.Should().NotBeNull();
        row!.SubnetId.Should().Be(SubnetId);
        row.Kind.Should().Be("Managed");
    }
}
