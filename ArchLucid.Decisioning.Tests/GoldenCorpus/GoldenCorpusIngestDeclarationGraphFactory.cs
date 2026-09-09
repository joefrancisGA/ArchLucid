using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     Builds golden-corpus graphs from DX-42 in-batch declaration parsers plus minimal path overlays (DX-48).
/// </summary>
internal static class GoldenCorpusIngestDeclarationGraphFactory
{
    internal const string Case58DeclarationId = "decl-cfn-golden-58";

    internal const string Case58BucketArn = "arn:aws:s3:::pay-logs-cfn-demo";

    internal const string Case59DeclarationId = "decl-pulumi-golden-59";

    internal const string Case60DeclarationId = "decl-cdk-golden-60";

    internal const string Case65DeclarationId = "decl-tf-golden-65";

    internal const string Case66DeclarationId = "decl-tf-golden-66";

    internal const string Case67DeclarationId = "decl-tf-golden-67";

    internal const string Case68DeclarationId = "decl-tf-golden-68";

    internal const string Case69DeclarationId = "decl-tf-golden-69";

    internal static readonly Guid Case58RunId = Guid.Parse("20000000-0000-4000-8000-000000000058");

    internal static readonly Guid Case58ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000058");

    internal static readonly Guid Case58AwsPackageId = Guid.Parse("30000000-0000-4000-8000-000000000058");

    internal static readonly Guid Case59RunId = Guid.Parse("20000000-0000-4000-8000-000000000059");

    internal static readonly Guid Case59ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000059");

    internal static readonly Guid Case60RunId = Guid.Parse("20000000-0000-4000-8000-000000000060");

    internal static readonly Guid Case60ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000060");

    internal static readonly Guid Case65RunId = Guid.Parse("20000000-0000-4000-8000-000000000065");

    internal static readonly Guid Case65ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000065");

    internal static readonly Guid Case66RunId = Guid.Parse("20000000-0000-4000-8000-000000000066");

    internal static readonly Guid Case66ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000066");

    internal static readonly Guid Case67RunId = Guid.Parse("20000000-0000-4000-8000-000000000067");

    internal static readonly Guid Case67ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000067");

    internal static readonly Guid Case68RunId = Guid.Parse("20000000-0000-4000-8000-000000000068");

    internal static readonly Guid Case68ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000068");

    internal static readonly Guid Case69RunId = Guid.Parse("20000000-0000-4000-8000-000000000069");

    internal static readonly Guid Case69ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000069");

    private static readonly SimpleTerraformDeclarationParser TerraformParser = new();

    private static readonly CloudFormationInfrastructureDeclarationParser CloudFormationParser =
        new(NullLogger<CloudFormationInfrastructureDeclarationParser>.Instance);

    private static readonly PulumiStackJsonInfrastructureDeclarationParser PulumiParser =
        new(NullLogger<PulumiStackJsonInfrastructureDeclarationParser>.Instance);

    private static readonly CdkSynthInfrastructureDeclarationParser CdkParser =
        new(NullLogger<CdkSynthInfrastructureDeclarationParser>.Instance);

    private static readonly GraphNodeFactory NodeFactory = new();

    internal static async Task<GraphSnapshot> CreateCase58CloudFormationContradictionGraphAsync()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "pay-logs-bucket.template.json",
            Format = "cloudformation",
            DeclarationId = Case58DeclarationId,
            Content = """
                      {
                        "AWSTemplateFormatVersion": "2010-09-09",
                        "Resources": {
                          "PayLogsBucket": {
                            "Type": "AWS::S3::Bucket",
                            "Properties": {
                              "BucketName": "pay-logs-cfn-demo",
                              "PublicNetworkAccess": "Disabled"
                            }
                          }
                        }
                      }
                      """,
        };

        GraphNode bucketNode = (await ParseSingleTopologyNodeAsync(CloudFormationParser, declaration).ConfigureAwait(false))
            .Single();

        bucketNode.Properties["arn"] = Case58BucketArn;
        bucketNode.Properties["resourceId"] = Case58BucketArn;

        return WrapCaseGraph(58, [bucketNode], []);
    }

    internal static GoldenCorpusInventoryFixtureDocument CreateCase58AwsInventoryFixture()
    {
        return new GoldenCorpusInventoryFixtureDocument
        {
            CloudProvider = "Aws",
            CloudPackageId = Case58AwsPackageId,
            CloudResourcesJson =
                """
                [
                  {
                    "name": "arn:aws:s3:::pay-logs-cfn-demo",
                    "resourceType": "AWS::S3::Bucket",
                    "location": "us-east-1",
                    "properties": {
                      "publiclyAccessible": true
                    }
                  }
                ]
                """,
        };
    }

    internal static async Task<GraphSnapshot> CreateCase59PulumiIdentityBlastRadiusGraphAsync()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "stack.json",
            Format = "pulumi-stack-json",
            DeclarationId = Case59DeclarationId,
            Content = """
                      {
                        "version": 3,
                        "deployment": {
                          "resources": [
                            {
                              "urn": "urn:pulumi:demo::proj::azure-native:storage:StorageAccount::kvdatastore",
                              "type": "azure-native:storage:StorageAccount",
                              "outputs": {
                                "name": "kvdatastore",
                                "allowBlobPublicAccess": false
                              }
                            }
                          ]
                        }
                      }
                      """,
        };

        GraphNode datastoreNode = (await ParseSingleTopologyNodeAsync(PulumiParser, declaration).ConfigureAwait(false))
            .Single();

        datastoreNode.Properties["category"] = GraphTopologyCategories.Storage;
        datastoreNode.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing;

        GraphNode actor = new()
        {
            NodeId = "actor-checkout",
            NodeType = GraphNodeTypes.Actor,
            Label = "checkout-func",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Machine),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
            },
        };

        GraphNode roleAssignment = new()
        {
            NodeId = "role-contrib-kv",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-contributor-kv",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
            },
        };

        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                FromNodeId = actor.NodeId,
                ToNodeId = roleAssignment.NodeId,
                EdgeType = GraphEdgeTypes.RelatesTo,
                Weight = 1.0,
            },
            new GraphEdge
            {
                FromNodeId = roleAssignment.NodeId,
                ToNodeId = datastoreNode.NodeId,
                EdgeType = GraphEdgeTypes.AppliesTo,
                Weight = 1.0,
            },
        ];

        return WrapCaseGraph(59, [actor, roleAssignment, datastoreNode], edges);
    }

    internal static async Task<GraphSnapshot> CreateCase60CdkDataFlowTrustBoundaryGraphAsync()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "OrdersApiStack.template.json",
            Format = "cdk-synth",
            DeclarationId = Case60DeclarationId,
            Content = """
                      {
                        "AWSTemplateFormatVersion": "2010-09-09",
                        "Resources": {
                          "OrdersApiFunction": {
                            "Type": "AWS::Lambda::Function",
                            "Properties": {
                              "FunctionName": "orders-api",
                              "Runtime": "nodejs20.x"
                            }
                          }
                        }
                      }
                      """,
        };

        GraphNode computeNode = (await ParseSingleTopologyNodeAsync(CdkParser, declaration).ConfigureAwait(false))
            .Single();

        computeNode.Properties["category"] = GraphTopologyCategories.Compute;

        GraphNode actor = new()
        {
            NodeId = "actor-external-lb",
            NodeType = GraphNodeTypes.Actor,
            Label = "external-ingress-lb",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["trustOrigin"] = nameof(TrustOrigin.External),
            },
        };

        GraphNode datastore = new()
        {
            NodeId = "sql-orders-prod",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-orders-prod",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Data,
            },
        };

        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                FromNodeId = actor.NodeId,
                ToNodeId = computeNode.NodeId,
                EdgeType = GraphEdgeTypes.ConnectsTo,
                Weight = 1.0,
            },
            new GraphEdge
            {
                FromNodeId = computeNode.NodeId,
                ToNodeId = datastore.NodeId,
                EdgeType = GraphEdgeTypes.ConnectsTo,
                Weight = 1.0,
            },
        ];

        return WrapCaseGraph(60, [actor, computeNode, datastore], edges);
    }

    internal static async Task<GraphSnapshot> CreateCase65TerraformIdentityPathGraphAsync()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "identity.tf",
            Format = "simple-terraform",
            DeclarationId = Case65DeclarationId,
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

        List<CanonicalObject> objects = (await TerraformParser.ParseAsync(declaration, CancellationToken.None)
            .ConfigureAwait(false)).ToList();

        foreach (CanonicalObject obj in objects)
        {
            if (!string.Equals(obj.Name, "pay_sql", StringComparison.OrdinalIgnoreCase))
                continue;

            obj.Properties["category"] = GraphTopologyCategories.Data;
            obj.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing;
        }

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Case65ContextSnapshotId,
            RunId = Case65RunId,
            ProjectId = "golden-case-65",
            CanonicalObjects = objects,
        };

        DefaultGraphBuilder builder = new(NodeFactory, new DefaultGraphEdgeInferer());
        GraphBuildResult build = await builder.BuildAsync(snapshot, CancellationToken.None).ConfigureAwait(false);

        List<GraphNode> nodes = build.Nodes
            .Where(static node => !string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return WrapCaseGraph(65, nodes, build.Edges);
    }

    internal static Task<GraphSnapshot> CreateCase66AwsIamIdentityPathGraphAsync()
    {
        return BuildParseThroughTerraformGraphAsync(
            caseNumber: 66,
            declarationId: Case66DeclarationId,
            contextSnapshotId: Case66ContextSnapshotId,
            runId: Case66RunId,
            hcl: """
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
    }

    internal static Task<GraphSnapshot> CreateCase67GcpIamIdentityPathGraphAsync()
    {
        return BuildParseThroughTerraformGraphAsync(
            caseNumber: 67,
            declarationId: Case67DeclarationId,
            contextSnapshotId: Case67ContextSnapshotId,
            runId: Case67RunId,
            hcl: """
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
    }

    internal static Task<GraphSnapshot> CreateCase68TerraformDataFlowPathGraphAsync()
    {
        return BuildParseThroughTerraformGraphAsync(
            caseNumber: 68,
            declarationId: Case68DeclarationId,
            contextSnapshotId: Case68ContextSnapshotId,
            runId: Case68RunId,
            hcl: """
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
    }

    internal static Task<GraphSnapshot> CreateCase69TerraformSegmentationPathGraphAsync()
    {
        return BuildParseThroughTerraformGraphAsync(
            caseNumber: 69,
            declarationId: Case69DeclarationId,
            contextSnapshotId: Case69ContextSnapshotId,
            runId: Case69RunId,
            hcl: """
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
    }

    private static async Task<GraphSnapshot> BuildParseThroughTerraformGraphAsync(
        int caseNumber,
        string declarationId,
        Guid contextSnapshotId,
        Guid runId,
        string hcl,
        string dataBearingObjectName,
        string category)
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "path.tf",
            Format = "simple-terraform",
            DeclarationId = declarationId,
            Content = hcl,
        };

        List<CanonicalObject> objects = (await TerraformParser.ParseAsync(declaration, CancellationToken.None)).ToList();

        foreach (CanonicalObject obj in objects)
        {
            if (!string.Equals(obj.Name, dataBearingObjectName, StringComparison.OrdinalIgnoreCase))
                continue;

            obj.Properties["category"] = category;
            obj.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing;
        }

        ContextSnapshot snapshot = new()
        {
            SnapshotId = contextSnapshotId,
            RunId = runId,
            ProjectId = $"golden-case-{caseNumber}",
            CanonicalObjects = objects,
        };

        DefaultGraphBuilder builder = new(NodeFactory, new DefaultGraphEdgeInferer());
        GraphBuildResult build = await builder.BuildAsync(snapshot, CancellationToken.None);

        List<GraphNode> nodes = build.Nodes
            .Where(static node => !string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return WrapCaseGraph(caseNumber, nodes, build.Edges);
    }

    private static async Task<IReadOnlyList<GraphNode>> ParseSingleTopologyNodeAsync(
        IInfrastructureDeclarationParser parser,
        InfrastructureDeclarationReference declaration)
    {
        IReadOnlyList<CanonicalObject> objects = await parser.ParseAsync(declaration, CancellationToken.None)
            .ConfigureAwait(false);

        List<GraphNode> nodes = objects
            .Select(static item => NodeFactory.CreateNode(item))
            .ToList();

        if (nodes.Count != 1)
        {
            throw new InvalidOperationException(
                $"Expected exactly one parsed node for {declaration.DeclarationId}; found {nodes.Count}.");
        }

        return nodes;
    }

    private static GraphSnapshot WrapCaseGraph(
        int caseNumber,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        string caseHex = caseNumber.ToString("D2", System.Globalization.CultureInfo.InvariantCulture);

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse($"000000{caseHex}-0000-4000-8000-0000000000{caseHex}"),
            ContextSnapshotId = Guid.Parse($"10000000-0000-4000-8000-0000000000{caseHex}"),
            RunId = Guid.Parse($"20000000-0000-4000-8000-0000000000{caseHex}"),
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
            Warnings = [],
        };
    }
}
