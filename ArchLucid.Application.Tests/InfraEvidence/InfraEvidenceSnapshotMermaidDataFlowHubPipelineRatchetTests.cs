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

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests
{
    private static readonly Guid SnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-111111111111");

    [Fact]
    public async Task InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet_data_flow_mode_keeps_hub_pipeline_mermaid()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();
        InfraEvidenceSnapshotMermaidService service = CreateServiceWithGraph(graph);
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(
                scope,
                SnapshotId,
                "dataFlow",
                null,
                null,
                includePrivateEndpointNodes: false,
                cancellationToken: CancellationToken.None);

        result.Succeeded.Should().BeTrue(result.ErrorMessage);
        result.Value.Should().NotBeNull();
        result.Value!.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded.ToString());

        string mermaid = result.Value.Mermaid!;

        mermaid.Should().Contain(MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId));
        mermaid.Should().Contain(MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId));
        mermaid.Should().Contain(MermaidIdSanitizer.Sanitize("st0"));
        mermaid.Should().Contain(MermaidIdSanitizer.Sanitize("st11"));

        AssertMermaidDirectedEdge(
            mermaid,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId);
        AssertMermaidDirectedEdge(
            mermaid,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId,
            "st0");
        AssertMermaidDirectedEdge(
            mermaid,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId,
            "st11");

        mermaid.Should().NotContain("privateEndpoint", "PE cards must stay off when includePrivateEndpointNodes is false");
    }

    private static void AssertMermaidDirectedEdge(string mermaid, string fromNodeId, string toNodeId)
    {
        string from = MermaidIdSanitizer.Sanitize(fromNodeId);
        string to = MermaidIdSanitizer.Sanitize(toNodeId);

        bool found = mermaid
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(line =>
                line.StartsWith(from, StringComparison.Ordinal)
                && line.Contains(to, StringComparison.Ordinal)
                && (line.Contains("-->", StringComparison.Ordinal) || line.Contains("-.->", StringComparison.Ordinal)));

        found.Should().BeTrue($"expected Mermaid edge {from} → {to}");
    }

    private static InfraEvidenceSnapshotMermaidService CreateServiceWithGraph(GraphSnapshot graph)
    {
        Mock<IBrandedDiagramExportService> brandedDiagramExportService = new();
        brandedDiagramExportService
            .Setup(service => service.DecorateMermaidSourceForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, string source, BrandingDisplayContext _, CancellationToken _) => source);

        return new InfraEvidenceSnapshotMermaidService(
            new FixedGraphResolver(graph),
            CreateInventoryRenderOrchestrator(),
            CreateFallbackSetBuilder(),
            brandedDiagramExportService.Object,
            new NullDiagramImageRenderer(),
            new DiagramAstGraphvizDotEmitter(),
            new DiagramForestLayoutSvgRenderer(),
            new NullGraphvizLayoutRenderer(),
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
