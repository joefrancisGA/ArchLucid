using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceParserTests
{
    [Fact]
    public void TryParse_valid_row_succeeds()
    {
        JsonElement element = JsonDocument.Parse(
            """
            {
              "factoryResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1",
              "linkedServiceResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/ls1",
              "linkedServiceName": "ls1",
              "linkedServiceType": "AzureBlobStorage",
              "targetHost": "sa1.blob.core.windows.net",
              "collectionStatus": "Succeeded"
            }
            """).RootElement;

        bool parsed = AzureInventoryAdfLinkedServiceParser.TryParse(element, out AzureInventoryAdfLinkedServiceRow? row, out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        row!.TargetHost.Should().Be("sa1.blob.core.windows.net");
    }

    [Fact]
    public void TryParse_rejects_missing_required_fields()
    {
        JsonElement element = JsonDocument.Parse("""{"linkedServiceName":"ls1"}""").RootElement;

        AzureInventoryAdfLinkedServiceParser.TryParse(element, out _, out string? error).Should().BeFalse();
        error.Should().Contain("required");
    }

    [Fact]
    public void TryParse_rejects_unknown_collection_status()
    {
        JsonElement element = JsonDocument.Parse(
            """
            {
              "factoryResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1",
              "linkedServiceResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/ls1",
              "linkedServiceName": "ls1",
              "linkedServiceType": "AzureBlobStorage",
              "collectionStatus": "RuntimeObserved"
            }
            """).RootElement;

        AzureInventoryAdfLinkedServiceParser.TryParse(element, out _, out string? error).Should().BeFalse();
        error.Should().Contain("collectionStatus");
    }
}
