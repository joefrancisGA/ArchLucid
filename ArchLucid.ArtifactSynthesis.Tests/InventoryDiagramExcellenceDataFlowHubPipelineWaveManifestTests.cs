using System.Reflection;

using FluentAssertions;

using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineWaveManifestTests
{
    private static readonly string[] RequiredHubPipelineRatchetClassNames =
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
    public void InventoryDiagramExcellence_data_flow_hub_pipeline_wave_manifest_lists_all_ratchet_classes()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceDataFlowHubPipelineWaveManifestTests).Assembly;

        foreach (string className in RequiredHubPipelineRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.ArtifactSynthesis.Tests.{className}", throwOnError: false);
            type.Should().NotBeNull($"hub pipeline wave requires ratchet type {className}");

            bool hasFact = type!
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Any(method => method.GetCustomAttributesData()
                    .Any(data => data.AttributeType.Name == "FactAttribute"));

            hasFact.Should().BeTrue($"type {className} must expose at least one [Fact] ratchet");
        }
    }
}
