using System.Reflection;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelineWaveManifestTests
{
    private static readonly string[] RequiredHubPipelineServiceRatchetClassNames =
    [
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineTraitGuardTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineWaveManifestTests),
    ];

    [Fact]
    public void InfraEvidenceSnapshotMermaid_data_flow_hub_pipeline_wave_manifest_lists_service_ratchets()
    {
        Assembly assembly = typeof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineWaveManifestTests).Assembly;

        foreach (string className in RequiredHubPipelineServiceRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.Application.Tests.InfraEvidence.{className}", throwOnError: false);
            type.Should().NotBeNull($"hub pipeline wave requires service ratchet type {className}");

            bool hasFact = type!
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Any(method => method.GetCustomAttributesData()
                    .Any(data => data.AttributeType.Name == "FactAttribute"));

            hasFact.Should().BeTrue($"type {className} must expose at least one [Fact] ratchet");
        }
    }
}
