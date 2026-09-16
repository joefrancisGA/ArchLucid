using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfPipelineFlowExtractorTests
{
    private const string FactoryId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void ExtractFlows_emits_read_and_write_for_copy_activity()
    {
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "CopyBlob",
                    "type": "Copy",
                    "inputs": [ { "referenceName": "SourceDs", "type": "DatasetReference" } ],
                    "outputs": [ { "referenceName": "SinkDs", "type": "DatasetReference" } ]
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().HaveCount(2);
        flows.Should().Contain(flow =>
            flow.DatasetName == "SourceDs"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read
            && flow.ActivityName == "CopyBlob");
        flows.Should().Contain(flow =>
            flow.DatasetName == "SinkDs"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write
            && flow.ActivityName == "CopyBlob");
    }

    [Fact]
    public void ExtractFlows_expands_execute_pipeline_with_static_reference()
    {
        JsonElement childPipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/child",
              "name": "child",
              "properties": {
                "activities": [
                  {
                    "name": "ReadChild",
                    "type": "Lookup",
                    "inputs": [ { "referenceName": "ChildDs", "type": "DatasetReference" } ]
                  }
                ]
              }
            }
            """);

        JsonElement parentPipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/parent",
              "name": "parent",
              "properties": {
                "activities": [
                  {
                    "name": "RunChild",
                    "type": "ExecutePipeline",
                    "typeProperties": {
                      "pipeline": { "referenceName": "child", "type": "PipelineReference" }
                    }
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [parentPipeline, childPipeline]);

        flows.Should().ContainSingle();
        flows[0].DatasetName.Should().Be("ChildDs");
        flows[0].PipelineName.Should().Be("child");
    }

    [Fact]
    public void ExtractFlows_skips_dynamic_dataset_references()
    {
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "DynamicCopy",
                    "type": "Copy",
                    "inputs": [ { "referenceName": "@dataset().name", "type": "DatasetReference" } ]
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().BeEmpty();
    }

    [Fact]
    public void ExtractFlows_expands_execute_data_flow_through_linked_services()
    {
        AzureInventoryAdfDataflowRow dataflow = new()
        {
            FactoryResourceId = FactoryId,
            DataflowResourceId =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/dataflows/df1",
            DataflowName = "df1",
            SourceLinkedServiceNames = ["BlobLS"],
            SinkLinkedServiceNames = ["SqlLS"],
        };

        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "Transform",
                    "type": "ExecuteDataFlow",
                    "typeProperties": {
                      "dataFlow": { "referenceName": "df1", "type": "DataFlowReference" }
                    }
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline], dataflowRows: [dataflow]);

        flows.Should().HaveCount(2);
        flows.Should().Contain(flow =>
            flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read
            && flow.DatasetName == "__linkedService:BlobLS");
        flows.Should().Contain(flow =>
            flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write
            && flow.DatasetName == "__linkedService:SqlLS");
    }

    [Fact]
    public void ExtractFlows_does_not_cycle_on_recursive_execute_pipeline()
    {
        JsonElement pipelineA = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/a",
              "name": "a",
              "properties": {
                "activities": [
                  {
                    "name": "ToB",
                    "type": "ExecutePipeline",
                    "typeProperties": {
                      "pipeline": { "referenceName": "b", "type": "PipelineReference" }
                    }
                  }
                ]
              }
            }
            """);

        JsonElement pipelineB = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/b",
              "name": "b",
              "properties": {
                "activities": [
                  {
                    "name": "ToA",
                    "type": "ExecutePipeline",
                    "typeProperties": {
                      "pipeline": { "referenceName": "a", "type": "PipelineReference" }
                    }
                  },
                  {
                    "name": "WriteB",
                    "type": "Copy",
                    "outputs": [ { "referenceName": "SinkDs", "type": "DatasetReference" } ]
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipelineA, pipelineB]);

        flows.Should().ContainSingle();
        flows[0].DatasetName.Should().Be("SinkDs");
    }

    private static JsonElement Parse(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
