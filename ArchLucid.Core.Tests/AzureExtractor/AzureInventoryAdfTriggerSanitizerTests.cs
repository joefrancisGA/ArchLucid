using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfTriggerSanitizerTests
{
    private const string FactoryId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void TrySanitizeFromArmResource_reads_pipeline_reference_name_from_schedule_and_tumbling_window()
    {
        // Data Factory 2018-06-01 stores the name under pipelineReference, not as a scalar.
        // Schedule triggers use a pipelines array. Tumbling-window triggers use one pipeline object.
        using JsonDocument schedule = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/triggers/Daily",
              "name": "Daily",
              "properties": {
                "type": "ScheduleTrigger",
                "typeProperties": {
                  "recurrence": { "frequency": "Day", "interval": 1 },
                  "pipelines": [
                    {
                      "pipelineReference": {
                        "referenceName": "Ingest",
                        "type": "PipelineReference"
                      }
                    }
                  ]
                }
              }
            }
            """);
        using JsonDocument tumbling = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/triggers/Hourly",
              "name": "Hourly",
              "properties": {
                "type": "TumblingWindowTrigger",
                "typeProperties": {
                  "frequency": "Hour",
                  "interval": 1,
                  "pipeline": {
                    "pipelineReference": {
                      "referenceName": "WindowIngest",
                      "type": "PipelineReference"
                    }
                  }
                }
              }
            }
            """);

        bool scheduleParsed = AzureInventoryAdfTriggerSanitizer.TrySanitizeFromArmResource(
            FactoryId,
            schedule.RootElement,
            out AzureInventoryAdfTriggerRow? scheduleRow);
        bool tumblingParsed = AzureInventoryAdfTriggerSanitizer.TrySanitizeFromArmResource(
            FactoryId,
            tumbling.RootElement,
            out AzureInventoryAdfTriggerRow? tumblingRow);

        scheduleParsed.Should().BeTrue();
        scheduleRow.Should().NotBeNull();
        scheduleRow!.PipelineNames.Should().Equal("Ingest");
        tumblingParsed.Should().BeTrue();
        tumblingRow.Should().NotBeNull();
        tumblingRow!.PipelineNames.Should().Equal("WindowIngest");
    }
}
