using System.Reflection;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelineTraitGuardTests
{
    private static readonly string[] HubPipelineServiceRatchetClassNames =
    [
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineTraitGuardTests),
        nameof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineWaveManifestTests),
    ];

    [Fact]
    public void InfraEvidenceSnapshotMermaid_data_flow_hub_pipeline_service_classes_carry_trait()
    {
        Assembly assembly = typeof(InfraEvidenceSnapshotMermaidDataFlowHubPipelineTraitGuardTests).Assembly;

        foreach (string className in HubPipelineServiceRatchetClassNames)
        {
            Type? type = assembly.GetType($"ArchLucid.Application.Tests.InfraEvidence.{className}", throwOnError: false);
            type.Should().NotBeNull($"expected hub pipeline service ratchet type {className}");

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
