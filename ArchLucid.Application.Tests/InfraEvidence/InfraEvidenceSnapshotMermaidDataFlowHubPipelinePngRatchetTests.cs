using ArchLucid.Application.Graphviz;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Architecture;

using System.Xml.Linq;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests
{
    private static readonly Guid SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-111111111111");

    private static readonly byte[] MinimalPngHeader =
    [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    ];

    [Fact]
    public async Task InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchet_export_uses_compiled_hub_pipeline_dot()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();
        CapturingGraphvizLayoutRenderer capturingRenderer = new();
        InfraEvidenceSnapshotMermaidService service = CreateServiceWithGraph(graph, capturingRenderer);
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<byte[]> result = await service.TryExportPngAsync(
            scope,
            SnapshotId,
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
                SnapshotId,
                "dataFlow",
                null,
                null,
                includePrivateEndpointNodes: false,
                cancellationToken: CancellationToken.None);

        layoutResult.Succeeded.Should().BeTrue(layoutResult.ErrorMessage);
        layoutResult.Value!.LayoutSvg.Should().NotBeNullOrWhiteSpace();

        InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions.AssertStageLabels(
            XDocument.Parse(layoutResult.Value.LayoutSvg!));
    }

    private static InfraEvidenceSnapshotMermaidService CreateServiceWithGraph(
        GraphSnapshot graph,
        IGraphvizLayoutRenderer graphvizLayoutRenderer)
    {
        Mock<IBrandedDiagramExportService> brandedDiagramExportService = new();
        brandedDiagramExportService
            .Setup(service => service.DecorateMermaidSourceForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, string source, BrandingDisplayContext _, CancellationToken _) => source);

        brandedDiagramExportService
            .Setup(service => service.WrapRenderedPngForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<byte[]>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, byte[]? png, BrandingDisplayContext _, CancellationToken _) => png);

        return new InfraEvidenceSnapshotMermaidService(
            new FixedGraphResolver(graph),
            CreateInventoryRenderOrchestrator(),
            CreateFallbackSetBuilder(),
            brandedDiagramExportService.Object,
            new NullDiagramImageRenderer(),
            new DiagramAstGraphvizDotEmitter(),
            new DiagramForestLayoutSvgRenderer(),
            graphvizLayoutRenderer,
            new NoOpArchitectureDiagramReconciliationRepository(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            new MermaidDiagramReadabilityThresholds());
    }

    private static MermaidDiagramInventoryRenderOrchestrator CreateInventoryRenderOrchestrator()
    {
        DiagramAstFromGraphCompiler compiler = new();

        MermaidDiagramRenderPipeline pipeline = new(
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new MermaidDiagramSemanticIntegrityGuard(),
            new MermaidDiagramFallbackSetBuilder(
                compiler,
                new MermaidDiagramRenderer(),
                new MermaidDiagramComplexityAnalyzer(),
                new MermaidDiagramDeterministicRepairer(),
                new MermaidDiagramStructuralValidator(),
                new DiagramPeelCatalogDefaultProvider()));

        return new MermaidDiagramInventoryRenderOrchestrator(
            compiler,
            pipeline,
            new DiagramPeelCatalogDefaultProvider(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator());
    }

    private static MermaidDiagramFallbackSetBuilder CreateFallbackSetBuilder()
    {
        DiagramAstFromGraphCompiler compiler = new();

        return new MermaidDiagramFallbackSetBuilder(
            compiler,
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new DiagramPeelCatalogDefaultProvider());
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
    }

    private sealed class FixedGraphResolver(GraphSnapshot graph) : IAzureInventorySnapshotGraphResolver
    {
        public Task<AzureInventorySnapshotGraphResolveResult> TryResolveGraphAsync(
            ScopeContext scope,
            Guid snapshotId,
            bool includeNeverShowArmTypes = false,
            bool retainIdentityDiagramArmTypes = false,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(scope);

            return Task.FromResult(new AzureInventorySnapshotGraphResolveResult
            {
                Succeeded = true,
                Graph = graph,
            });
        }
    }

    private sealed class NullDiagramImageRenderer : IDiagramImageRenderer
    {
        public Task<byte[]?> RenderMermaidPngAsync(string mermaidDiagram, CancellationToken cancellationToken = default)
            => Task.FromResult<byte[]?>(null);
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
