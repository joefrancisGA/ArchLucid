using System.Reflection;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineTraitGuardTests
{
    private static readonly string[] HubPipelineRatchetClassNames =
    [
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineDotRatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineStageLabelParityTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineTraitGuardTests),
        nameof(InventoryDiagramExcellenceDataFlowHubPipelineWaveManifestTests),
    ];

    [Fact]
    public void InventoryDiagramExcellence_data_flow_hub_pipeline_ratchet_classes_carry_trait()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceDataFlowHubPipelineTraitGuardTests).Assembly;

        foreach (string className in HubPipelineRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.ArtifactSynthesis.Tests.{className}", throwOnError: false);
            type.Should().NotBeNull($"expected hub pipeline ratchet type {className}");

            bool hasTrait = type!
                .GetCustomAttributesData()
                .Any(data =>
                    data.AttributeType.Name == "TraitAttribute"
                    && data.ConstructorArguments.Count >= 2
                    && data.ConstructorArguments[0].Value?.ToString() == "InventoryDiagramExcellence"
                    && data.ConstructorArguments[1].Value?.ToString() == "DataFlowHubPipeline");

            hasTrait.Should().BeTrue($"type {className} must declare InventoryDiagramExcellence=DataFlowHubPipeline");
        }
    }
}
