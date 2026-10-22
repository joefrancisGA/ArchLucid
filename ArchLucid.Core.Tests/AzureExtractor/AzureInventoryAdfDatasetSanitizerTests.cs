using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfDatasetSanitizerTests
{
    private const string FactoryId =
        "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void TrySanitizeFromArmResource_coerces_numeric_linked_service_reference_name_to_string_token()
    {
        JsonElement dataset = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/datasets/BlobDs",
              "name": "BlobDs",
              "properties": {
                "linkedServiceName": { "referenceName": 42, "type": "LinkedServiceReference" },
                "type": "AzureBlob",
                "typeProperties": { "folderPath": "inbound" }
              }
            }
            """).RootElement;

        AzureInventoryAdfDatasetSanitizer.TrySanitizeFromArmResource(FactoryId, dataset, out AzureInventoryAdfDatasetRow? row)
            .Should().BeTrue();

        row!.LinkedServiceName.Should().Be("42");
        row.CollectionStatus.Should().Be(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
    }
}
