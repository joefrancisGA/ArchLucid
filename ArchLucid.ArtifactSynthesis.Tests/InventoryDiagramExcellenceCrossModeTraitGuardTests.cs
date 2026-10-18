using System.Reflection;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceCrossModeTraitGuardTests
{
    private static readonly string[] CrossModeRatchetClassNames =
    [
        nameof(InventoryDiagramExcellenceIdx13RatchetTests),
        nameof(InventoryDiagramExcellenceIdx13ModeRatchetTests),
        nameof(InventoryDiagramExcellenceForestRatchetTests),
        nameof(InventoryDiagramExcellenceNestedFrameParityTests),
        nameof(InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchetTests),
        nameof(InventoryDiagramExcellencePeeledSubnetVnetFrameRatchetTests),
        nameof(InventoryDiagramExcellenceFatGraphForestDotParityRatchetTests),
        nameof(InventoryDiagramExcellenceSingletonTailRatchetTests),
        nameof(InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchetTests),
        nameof(InventoryDiagramExcellenceDuplicateConnectionRatchetTests),
        nameof(InventoryDiagramExcellencePrivateEndpointOptInRatchetTests),
        nameof(InventoryDiagramExcellenceHopFocusRatchetTests),
        nameof(InventoryDiagramExcellenceIdx07RatchetTests),
        nameof(InventoryDiagramExcellenceDataFlowInStageHubLayoutTests),
        nameof(InventoryDiagramExcellenceCrossModeWaveManifestTests),
        nameof(InventoryDiagramExcellenceCrossModeTraitGuardTests),
    ];

    [Fact]
    public void InventoryDiagramExcellence_cross_mode_trait_guard_excludes_data_flow_hub_pipeline_trait()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceCrossModeTraitGuardTests).Assembly;

        foreach (string className in CrossModeRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.ArtifactSynthesis.Tests.{className}", throwOnError: false);
            type.Should().NotBeNull($"expected cross-mode ratchet type {className}");

            bool hasHubPipelineTrait = type!
                .GetCustomAttributesData()
                .Any(data =>
                    data.AttributeType.Name == "TraitAttribute"
                    && data.ConstructorArguments.Count >= 2
                    && data.ConstructorArguments[0].Value?.ToString() == "InventoryDiagramExcellence"
                    && data.ConstructorArguments[1].Value?.ToString() == "DataFlowHubPipeline");

            hasHubPipelineTrait.Should().BeFalse(
                $"type {className} is cross-mode and must not declare InventoryDiagramExcellence=DataFlowHubPipeline");
        }
    }
}
