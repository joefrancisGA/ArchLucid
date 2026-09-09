using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
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

    [Fact]
    public async Task DefaultGraphBuilder_materializes_aws_iam_attachment_path()
    {
        GraphSnapshot graph = await BuildParseThroughGraphAsync(
            """
            resource "aws_iam_role" "pay_runner" {
              name = "pay-runner"
            }
            resource "aws_s3_bucket" "pay_bucket" {
              bucket = "pay-bucket"
            }
            resource "aws_iam_role_policy_attachment" "s3_full" {
              role       = "pay_runner"
              policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
              scope      = "pay_bucket"
            }
            """,
            dataBearingObjectName: "pay_bucket",
            category: GraphTopologyCategories.Storage);

        graph.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityIamPath);
        IdentityPathAnalyzer.Analyze(graph).Should().NotBeEmpty();
    }

    [Fact]
    public async Task DefaultGraphBuilder_materializes_gcp_iam_member_path()
    {
        GraphSnapshot graph = await BuildParseThroughGraphAsync(
            """
            resource "google_service_account" "pay_runner" {
              account_id = "pay-runner"
            }
            resource "google_secret_manager_secret" "pay_secret" {
              secret_id = "pay-secret"
            }
            resource "google_secret_manager_secret_iam_member" "runner_admin" {
              member    = "pay_runner"
              role      = "roles/secretmanager.admin"
              secret_id = "pay-secret"
              scope     = "pay_secret"
            }
            """,
            dataBearingObjectName: "pay_secret",
            category: GraphTopologyCategories.Storage);

        graph.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityIamPath);
        IdentityPathAnalyzer.Analyze(graph).Should().NotBeEmpty();
    }

    [Fact]
    public async Task DefaultGraphBuilder_materializes_data_flow_connects_to_from_lb()
    {
        GraphSnapshot graph = await BuildParseThroughGraphAsync(
            """
            resource "aws_lb" "edge" {
              name    = "edge-alb"
              backend = "pay_api"
            }
            resource "aws_lambda_function" "pay_api" {
              function_name = "pay-api"
              connected_to  = "pay_sql"
            }
            resource "aws_db_instance" "pay_sql" {
              identifier = "pay-sql"
            }
            """,
            dataBearingObjectName: "pay_sql",
            category: GraphTopologyCategories.Data);

        graph.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.DeclarationIdentityDataFlowPath);
        DataFlowTrustBoundaryPathAnalyzer.Analyze(graph).Should().NotBeEmpty();
    }

    [Fact]
    public async Task DefaultGraphBuilder_materializes_nsg_association_path()
    {
        GraphSnapshot graph = await BuildParseThroughGraphAsync(
            """
            resource "azurerm_network_security_group" "edge" {
              name = "edge-nsg"
              security_rule {
                name                       = "ssh"
                priority                   = 100
                direction                  = "Inbound"
                access                     = "Allow"
                protocol                   = "Tcp"
                source_port_range          = "*"
                destination_port_range     = "22"
                source_address_prefix      = "*"
                destination_address_prefix = "*"
              }
            }
            resource "azurerm_subnet" "app" {
              name         = "app-subnet"
              connected_to = "pay_sql"
            }
            resource "azurerm_subnet_network_security_group_association" "edge_app" {
              subnet_id                 = "app"
              network_security_group_id = "edge"
            }
            resource "azurerm_mssql_server" "pay_sql" {
              name = "pay-sql-prod"
            }
            """,
            dataBearingObjectName: "pay_sql",
            category: GraphTopologyCategories.Data);

        graph.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.DeclarationSegmentationPath);

        GraphNode nsg = graph.Nodes.Should().Contain(node =>
            node.Properties.ContainsKey("terraformType")
            && DeclarationSegmentationTerraformTypes.IsSegmentationControlTerraformType(node.Properties["terraformType"])).Subject;

        SegmentationSemanticsPathAnalyzer.HasPathToSensitiveTarget(
                graph,
                nsg.NodeId,
                out GraphNode? target,
                out _)
            .Should()
            .BeTrue();
        target.Should().NotBeNull();
    }

    private static async Task<GraphSnapshot> BuildParseThroughGraphAsync(
        string hcl,
        string dataBearingObjectName,
        string category)
    {
        SimpleTerraformDeclarationParser parser = new();
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "path.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-integration-path",
            Content = hcl,
        };

        List<CanonicalObject> objects = (await parser.ParseAsync(declaration, CancellationToken.None)).ToList();

        foreach (CanonicalObject obj in objects)
        {
            if (!string.Equals(obj.Name, dataBearingObjectName, StringComparison.OrdinalIgnoreCase))
                continue;

            obj.Properties["category"] = category;
            obj.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing;
        }

        ContextSnapshot snapshot = new()
        {
            SnapshotId = snapshotId,
            RunId = Guid.NewGuid(),
            ProjectId = "integration-path",
            CanonicalObjects = objects,
        };

        DefaultGraphBuilder builder = new(new GraphNodeFactory(), new DefaultGraphEdgeInferer());
        GraphBuildResult build = await builder.BuildAsync(snapshot, CancellationToken.None);

        return new GraphSnapshot
        {
            Nodes = build.Nodes
                .Where(node => !string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            Edges = build.Edges.ToList(),
        };
    }
}
