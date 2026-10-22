using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InventoryDiagramExcellenceCompletenessSummaryRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void InventoryDiagramExcellence_network_mode_surfaces_nicToSubnet_missing_class()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceCompletenessGraphFixture.BuildVmNicSubnetGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Network, new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "network",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing])!;

        summary.MissingClasses.Should().Contain("nicToSubnet");
    }

    [Fact]
    public void InventoryDiagramExcellence_identity_mode_omits_nicToSubnet_missing_class()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceCompletenessGraphFixture.BuildVmNicSubnetGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity, new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "identity",
            ast,
            [
                AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing,
                AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing,
            ])!;

        summary.MissingClasses.Should().NotContain("nicToSubnet");
        summary.MissingClasses.Should().Contain("logicAppConnections");
    }

    [Fact]
    public void InventoryDiagramExcellence_full_subscription_counts_hidden_hops()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceCompletenessGraphFixture.BuildVmNicSubnetGraph();
        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludePrivateEndpointNodes = false });

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "full",
            ast,
            [])!;

        summary.HiddenHopsUsedCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void InventoryDiagramExcellence_data_flow_surfaces_logic_app_missing_class()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceCompletenessGraphFixture.BuildVmNicSubnetGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow, new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary networkSummary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "network",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing])!;
        InfraEvidenceMermaidCompletenessSummary dataFlowSummary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "dataFlow",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing])!;

        networkSummary.MissingClasses.Should().NotContain("logicAppConnections");
        dataFlowSummary.MissingClasses.Should().Contain("logicAppConnections");
    }
}
