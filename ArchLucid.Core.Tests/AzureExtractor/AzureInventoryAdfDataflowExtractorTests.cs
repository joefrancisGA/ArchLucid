using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfDataflowExtractorTests
{
    private const string FactoryId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void TryExtractFromArmResource_reads_linked_service_beside_dataset()
    {
        // Data Factory ARM puts linkedService on the source/sink, next to dataset.
        // Inline sinks omit dataset and still name the linked service there.
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/dataflows/df1",
              "name": "df1",
              "properties": {
                "type": "MappingDataFlow",
                "typeProperties": {
                  "sources": [
                    {
                      "name": "source1",
                      "linkedService": { "referenceName": "BlobLS", "type": "LinkedServiceReference" },
                      "dataset": { "referenceName": "DelimitedText1", "type": "DatasetReference" }
                    }
                  ],
                  "sinks": [
                    {
                      "name": "sink1",
                      "linkedService": { "referenceName": "SqlLS", "type": "LinkedServiceReference" }
                    }
                  ]
                }
              }
            }
            """);

        bool parsed = AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource(
            FactoryId,
            document.RootElement,
            out AzureInventoryAdfDataflowRow? row);

        parsed.Should().BeTrue();
        row.Should().NotBeNull();
        row!.SourceLinkedServiceNames.Should().Equal("BlobLS");
        row.SinkLinkedServiceNames.Should().Equal("SqlLS");
    }
}
