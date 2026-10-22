using System.Reflection;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InventoryDiagramExcellenceCrossModeTraitGuardApplicationTests
{
    private static readonly string[] CrossModeApplicationRatchetClassNames =
    [
        nameof(InventoryDiagramExcellenceCompletenessSummaryRatchetTests),
        nameof(InventoryDiagramExcellenceCrossModeWaveManifestApplicationTests),
        nameof(InventoryDiagramExcellenceCrossModeTraitGuardApplicationTests),
    ];

    [Fact]
    public void InventoryDiagramExcellence_cross_mode_trait_guard_excludes_data_flow_hub_pipeline_trait_on_application_ratchets()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceCrossModeTraitGuardApplicationTests).Assembly;

        foreach (string className in CrossModeApplicationRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.Application.Tests.InfraEvidence.{className}", throwOnError: false);
            type.Should().NotBeNull($"expected cross-mode application ratchet type {className}");

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
