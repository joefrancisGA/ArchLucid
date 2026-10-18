using ArchLucid.Application.Graphviz;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

using System.Xml.Linq;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests
{
    private static readonly byte[] MinimalPngHeader =
    [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    ];

    [Fact]
    public async Task InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchet_export_uses_compiled_hub_pipeline_dot()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();
        CapturingGraphvizLayoutRenderer capturingRenderer = new();
        InfraEvidenceSnapshotMermaidService service = InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.CreateService(
            graph,
            capturingRenderer,
            enablePngExportBranding: true);
        ScopeContext scope = InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.CreateScope();

        InfraEvidenceMermaidServiceResult<byte[]> result = await service.TryExportPngAsync(
            scope,
            InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.SnapshotId,
            "dataFlow",
            null,
            null,
            includeNeverShowArmTypes: false,
            hiddenExecutiveTierKeys: null,
            cancellationToken: CancellationToken.None,
            includePrivateEndpointNodes: false);

        result.Succeeded.Should().BeTrue(result.ErrorMessage);
        result.Value.Should().NotBeNull();
        result.Value!.Length.Should().BeGreaterThan(0);

        capturingRenderer.LastDot.Should().NotBeNullOrWhiteSpace("inventory-forest PNG must emit Graphviz DOT from RepairedAst");
        InventoryDiagramExcellenceDataFlowHubPipelineCompiledDotAssertions.AssertHubPipelineDot(capturingRenderer.LastDot!);

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> layoutResult =
            await service.TryGetMermaidAsync(
                scope,
                InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.SnapshotId,
                "dataFlow",
                null,
                null,
                includePrivateEndpointNodes: false,
                cancellationToken: CancellationToken.None);

        layoutResult.Succeeded.Should().BeTrue(layoutResult.ErrorMessage);
        layoutResult.Value!.Mermaid.Should().NotBeNullOrWhiteSpace();
        layoutResult.Value.LayoutSvg.Should().NotBeNullOrWhiteSpace();

        InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll(
            layoutResult.Value.Mermaid,
            XDocument.Parse(layoutResult.Value.LayoutSvg!));
    }

    private sealed class CapturingGraphvizLayoutRenderer : IGraphvizLayoutRenderer
    {
        public string? LastDot { get; private set; }

        public Task<GraphvizLayoutRenderResult> RenderSvgAsync(string dot, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new GraphvizLayoutRenderResult
            {
                Succeeded = false,
                Error = "SVG not used in PNG ratchet test.",
            });
        }

        public Task<GraphvizLayoutRenderResult> RenderPngAsync(string dot, CancellationToken cancellationToken = default)
        {
            LastDot = dot;

            return Task.FromResult(new GraphvizLayoutRenderResult
            {
                Succeeded = true,
                Png = MinimalPngHeader,
            });
        }
    }
}
