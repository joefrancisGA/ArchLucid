using System.Reflection;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InventoryDiagramExcellenceCrossModeWaveManifestApplicationTests
{
    private static readonly string[] RequiredCrossModeApplicationRatchetClassNames =
    [
        nameof(InventoryDiagramExcellenceCompletenessSummaryRatchetTests),
        nameof(InventoryDiagramExcellenceCrossModeWaveManifestApplicationTests),
        nameof(InventoryDiagramExcellenceCrossModeTraitGuardApplicationTests),
    ];

    [Fact]
    public void InventoryDiagramExcellence_cross_mode_wave_manifest_lists_application_ratchet_classes()
    {
        Assembly assembly = typeof(InventoryDiagramExcellenceCrossModeWaveManifestApplicationTests).Assembly;

        foreach (string className in RequiredCrossModeApplicationRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.Application.Tests.InfraEvidence.{className}", throwOnError: false);
            type.Should().NotBeNull($"cross-mode application wave requires ratchet type {className}");

            bool hasRunnableTest = type!
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Any(method => method.GetCustomAttributesData()
                    .Any(data => data.AttributeType.Name is "FactAttribute" or "TheoryAttribute"));

            hasRunnableTest.Should().BeTrue($"type {className} must expose at least one [Fact] or [Theory] ratchet");
        }
    }
}
