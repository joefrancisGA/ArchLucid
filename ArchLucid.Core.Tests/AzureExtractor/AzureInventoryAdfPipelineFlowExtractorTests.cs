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
    public void ExtractFlows_keeps_static_input_reference_with_parameters_without_persisting_values()
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
                    "inputs": [
                      {
                        "referenceName": "SrcBlob",
                        "type": "DatasetReference",
                        "parameters": { "folder": "secret-value" }
                      }
                    ]
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().ContainSingle();
        flows[0].DatasetName.Should().Be("SrcBlob");
        JsonSerializer.Serialize(flows[0]).Should().NotContain("secret-value");
    }

    [Fact]
    public void ExtractFlows_reads_lookup_dataset_from_type_properties()
    {
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "Lookup",
                    "type": "Lookup",
                    "typeProperties": {
                      "dataset": { "referenceName": "LookupSet", "type": "DatasetReference" }
                    }
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().ContainSingle(flow =>
            flow.DatasetName == "LookupSet"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read);
    }

    [Fact]
    public void ExtractFlows_reads_copy_sink_dataset_from_type_properties()
    {
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "Copy",
                    "type": "Copy",
                    "typeProperties": {
                      "sink": {
                        "dataset": { "referenceName": "SinkSql", "type": "DatasetReference" }
                      }
                    }
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().ContainSingle(flow =>
            flow.DatasetName == "SinkSql"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write);
    }

    [Fact]
    public void ExtractFlows_skips_expression_type_property_dataset_reference()
    {
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "Lookup",
                    "type": "Lookup",
                    "typeProperties": {
                      "dataset": {
                        "referenceName": "DynamicDataset",
                        "type": "Expression"
                      }
                    }
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
    public void ExtractFlows_reads_copy_nested_in_foreach_and_if_condition()
    {
        // ADF ARM stores Copy inside ForEach.typeProperties.activities and
        // IfCondition ifTrueActivities / ifFalseActivities, not on the pipeline activity list.
        JsonElement pipeline = Parse("""
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
              "name": "p1",
              "properties": {
                "activities": [
                  {
                    "name": "ForEachTables",
                    "type": "ForEach",
                    "typeProperties": {
                      "items": { "value": "@pipeline().parameters.tables", "type": "Expression" },
                      "activities": [
                        {
                          "name": "CopyTable",
                          "type": "Copy",
                          "inputs": [ { "referenceName": "SourceDs", "type": "DatasetReference" } ],
                          "outputs": [ { "referenceName": "SinkDs", "type": "DatasetReference" } ]
                        }
                      ]
                    }
                  },
                  {
                    "name": "RouteByCase",
                    "type": "Switch",
                    "typeProperties": {
                      "on": { "value": "@pipeline().parameters.mode", "type": "Expression" },
                      "cases": [
                        {
                          "value": "copy",
                          "activities": [
                            {
                              "name": "CopyCase",
                              "type": "Copy",
                              "inputs": [ { "referenceName": "CaseSource", "type": "DatasetReference" } ]
                            }
                          ]
                        }
                      ],
                      "defaultActivities": [
                        {
                          "name": "CopyDefault",
                          "type": "Copy",
                          "outputs": [ { "referenceName": "DefaultSink", "type": "DatasetReference" } ]
                        }
                      ]
                    }
                  },
                  {
                    "name": "ChoosePath",
                    "type": "IfCondition",
                    "typeProperties": {
                      "expression": { "value": "@pipeline().parameters.copy", "type": "Expression" },
                      "ifTrueActivities": [
                        {
                          "name": "CopyWhenTrue",
                          "type": "Copy",
                          "inputs": [ { "referenceName": "TrueSource", "type": "DatasetReference" } ]
                        }
                      ],
                      "ifFalseActivities": [
                        {
                          "name": "CopyWhenFalse",
                          "type": "Copy",
                          "outputs": [ { "referenceName": "FalseSink", "type": "DatasetReference" } ]
                        }
                      ]
                    }
                  }
                ]
              }
            }
            """);

        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> flows =
            AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(FactoryId, [pipeline]);

        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyTable"
            && flow.DatasetName == "SourceDs"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read);
        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyTable"
            && flow.DatasetName == "SinkDs"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write);
        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyWhenTrue"
            && flow.DatasetName == "TrueSource"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read);
        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyWhenFalse"
            && flow.DatasetName == "FalseSink"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write);
        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyCase"
            && flow.DatasetName == "CaseSource"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Read);
        flows.Should().Contain(flow =>
            flow.ActivityName == "CopyDefault"
            && flow.DatasetName == "DefaultSink"
            && flow.FlowDirection == AzureInventoryAdfPipelineFlowDirection.Write);
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
