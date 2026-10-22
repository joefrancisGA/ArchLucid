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
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Architecture;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

internal static class InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory
{
    internal static readonly Guid SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-111111111111");

    internal static InfraEvidenceSnapshotMermaidService CreateService(
        GraphSnapshot graph,
        IGraphvizLayoutRenderer? graphvizLayoutRenderer = null,
        bool enablePngExportBranding = false)
    {
        ArgumentNullException.ThrowIfNull(graph);

        Mock<IBrandedDiagramExportService> brandedDiagramExportService = new();
        brandedDiagramExportService
            .Setup(service => service.DecorateMermaidSourceForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, string source, BrandingDisplayContext _, CancellationToken _) => source);

        if (enablePngExportBranding)
        {
            brandedDiagramExportService
                .Setup(service => service.WrapRenderedPngForExportAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<byte[]>(),
                    It.IsAny<BrandingDisplayContext>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, byte[]? png, BrandingDisplayContext _, CancellationToken _) => png);
        }

        return new InfraEvidenceSnapshotMermaidService(
            new FixedGraphResolver(graph),
            CreateInventoryRenderOrchestrator(),
            CreateFallbackSetBuilder(),
            brandedDiagramExportService.Object,
            new NullDiagramImageRenderer(),
            new DiagramAstGraphvizDotEmitter(),
            new DiagramForestLayoutSvgRenderer(),
            graphvizLayoutRenderer ?? new NullGraphvizLayoutRenderer(),
            new NoOpArchitectureDiagramReconciliationRepository(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            new MermaidDiagramReadabilityThresholds());
    }

    internal static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
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

        public AzureInventorySnapshotGraphResolveResult ResolveGraphFromSnapshot(
            AzureInventorySnapshotDetailReadModel snapshot,
            bool includeNeverShowArmTypes = false,
            bool retainIdentityDiagramArmTypes = false)
        {
            ArgumentNullException.ThrowIfNull(snapshot);

            return new AzureInventorySnapshotGraphResolveResult
            {
                Succeeded = true,
                Graph = graph,
                Snapshot = snapshot,
            };
        }
    }

    private sealed class NullDiagramImageRenderer : IDiagramImageRenderer
    {
        public Task<byte[]?> RenderMermaidPngAsync(string mermaidDiagram, CancellationToken cancellationToken = default)
            => Task.FromResult<byte[]?>(null);
    }

    private sealed class NullGraphvizLayoutRenderer : IGraphvizLayoutRenderer
    {
        public Task<GraphvizLayoutRenderResult> RenderSvgAsync(string dot, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new GraphvizLayoutRenderResult
            {
                Succeeded = false,
                Error = "Graphviz unavailable in unit tests.",
            });
        }

        public Task<GraphvizLayoutRenderResult> RenderPngAsync(string dot, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new GraphvizLayoutRenderResult
            {
                Succeeded = false,
                Error = "Graphviz unavailable in unit tests.",
            });
        }
    }
}
