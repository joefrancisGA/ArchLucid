using System.Reflection;

using FluentAssertions;

using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceCrossModeWaveManifestTests
{
    private static readonly string[] RequiredCrossModeRatchetClassNames =
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
    public void InventoryDiagramExcellence_cross_mode_wave_manifest_lists_all_ratchet_classes()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceCrossModeWaveManifestTests).Assembly;

        foreach (string className in RequiredCrossModeRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.ArtifactSynthesis.Tests.{className}", throwOnError: false);
            type.Should().NotBeNull($"cross-mode wave requires ratchet type {className}");

            bool hasRunnableTest = type!
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Any(method => method.GetCustomAttributesData()
                    .Any(data => data.AttributeType.Name is "FactAttribute" or "TheoryAttribute"));

            hasRunnableTest.Should().BeTrue($"type {className} must expose at least one [Fact] or [Theory] ratchet");
        }
    }
}
