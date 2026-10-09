using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfDataflowExtractorTests
{
    [Fact]
    public void TryExtractFromArmResource_resolves_direct_and_dataset_linked_services()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        string json = """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/dataflows/df1",
              "name": "df1",
              "properties": {
                "typeProperties": {
                  "sources": [
                    { "linkedService": { "referenceName": "BlobLS" } }
                  ],
                  "sinks": [
                    { "dataset": { "referenceName": "SinkSet" } }
                  ]
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool extracted = AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource(
            factoryId,
            document.RootElement,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["SinkSet"] = "SqlLS",
            },
            out AzureInventoryAdfDataflowRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.SourceLinkedServiceNames.Should().ContainSingle("BlobLS");
        row.SinkLinkedServiceNames.Should().ContainSingle("SqlLS");
    }
}
