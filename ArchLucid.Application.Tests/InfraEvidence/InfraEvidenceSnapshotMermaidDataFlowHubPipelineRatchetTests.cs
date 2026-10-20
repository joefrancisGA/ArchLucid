using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.InfraEvidence;

using System.Xml.Linq;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests
{
    [Fact]
    public async Task InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet_data_flow_mode_keeps_hub_pipeline_mermaid()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();
        InfraEvidenceSnapshotMermaidService service = InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.CreateService(graph);
        ScopeContext scope = InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(
                scope,
                InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory.SnapshotId,
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

        result.Value.LayoutEngine.Should().Be("inventory-forest");
        result.Value.LayoutSvg.Should().NotBeNullOrWhiteSpace();

        XDocument layoutSvg = XDocument.Parse(result.Value.LayoutSvg!);
        layoutSvg.Descendants()
            .Count(element => element.Attribute("data-hub-spoke")?.Value == "hub")
            .Should()
            .Be(1);

        InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll(mermaid, layoutSvg);

        DiagramAstFromGraphCompiler compiler = new();
        DiagramAst compiledAst = compiler.Compile(graph, DiagramMode.DataFlow);
        string landingNodeId = MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId);
        string factoryNodeId = MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId);
        IReadOnlyList<string> spokeNodeIds = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.SpokeGraphNodeIds()
            .Select(MermaidIdSanitizer.Sanitize)
            .ToList();

        InventoryDiagramExcellenceDataFlowHubRoutingAssertions.AssertCrossStageRouteAvoidsSpokeCards(
            compiledAst,
            layoutSvg,
            landingNodeId,
            factoryNodeId,
            spokeNodeIds);
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
}
