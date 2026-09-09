using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationIdentityPathGraphBuilderIntegrationTests
{
    [Fact]
    public async Task DefaultGraphBuilder_materializes_declaration_actor_and_iam_path_edges_from_parsed_tf()
    {
        SimpleTerraformDeclarationParser parser = new();
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "identity.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-integration-69",
            Content = """
                      resource "azurerm_user_assigned_identity" "checkout_mi" {
                        principal_id = "11111111-2222-3333-4444-555555555555"
                      }
                      resource "azurerm_mssql_server" "pay_sql" {
                        name = "pay-sql-prod"
                      }
                      resource "azurerm_role_assignment" "mi_sql_contributor" {
                        principal_id = "11111111-2222-3333-4444-555555555555"
                        role_definition_name = "Contributor"
                        scope = "pay-sql-prod"
                      }
                      """,
        };

        List<CanonicalObject> objects = (await parser.ParseAsync(declaration, CancellationToken.None)).ToList();

        foreach (CanonicalObject obj in objects)
        {
            if (!string.Equals(obj.Name, "pay_sql", StringComparison.OrdinalIgnoreCase))
                continue;

            obj.Properties["category"] = GraphTopologyCategories.Data;
            obj.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing;
        }

        ContextSnapshot snapshot = new()
        {
            SnapshotId = snapshotId,
            RunId = Guid.NewGuid(),
            ProjectId = "integration-69",
            CanonicalObjects = objects,
        };

        DefaultGraphBuilder builder = new(new GraphNodeFactory(), new DefaultGraphEdgeInferer());
        GraphBuildResult build = await builder.BuildAsync(snapshot, CancellationToken.None);

        build.Nodes.Should().Contain(node =>
            node.NodeType == GraphNodeTypes.Actor
            && node.Properties.ContainsKey("declarationSourceNodeId"));
        build.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityIamPath);

        GraphSnapshot graph = new()
        {
            Nodes = build.Nodes
                .Where(node => !string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            Edges = build.Edges.ToList(),
        };

        IdentityPathAnalyzer.Analyze(graph).Should().Contain(path => path.HopCount >= 2);
    }
}
