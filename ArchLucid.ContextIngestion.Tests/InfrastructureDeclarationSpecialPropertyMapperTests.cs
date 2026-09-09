using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InfrastructureDeclarationSpecialPropertyMapperTests
{
    private readonly SimpleTerraformDeclarationParser _parser = new();

    [Fact]
    public async Task ParseAsync_promotes_iam_and_backend_properties_for_path_materializer()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "identity.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-mapper-test",
            Content = """
                      resource "azurerm_user_assigned_identity" "checkout_mi" {
                        principal_id = "11111111-2222-3333-4444-555555555555"
                      }
                      resource "azurerm_role_assignment" "mi_sql_contributor" {
                        principal_id = "11111111-2222-3333-4444-555555555555"
                        role_definition_name = "Contributor"
                        scope = "pay-sql-prod"
                      }
                      resource "azurerm_linux_function_app" "payments_func" {
                        identity {
                          type = "SystemAssigned"
                        }
                        backend = "app-api"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _parser.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject identity = objects.Should().ContainSingle(o => o.Name == "checkout_mi").Subject;
        identity.Properties["principalId"].Should().Be("11111111-2222-3333-4444-555555555555");

        CanonicalObject roleAssignment = objects.Should().ContainSingle(o => o.Name == "mi_sql_contributor").Subject;
        roleAssignment.Properties["principalId"].Should().Be("11111111-2222-3333-4444-555555555555");
        roleAssignment.Properties["roleName"].Should().Be("contributor");
        roleAssignment.Properties["declarationTargetResourceId"].Should().Be("pay-sql-prod");

        CanonicalObject functionApp = objects.Should().ContainSingle(o => o.Name == "payments_func").Subject;
        functionApp.Properties["declarationBackendNodeId"].Should().Be("app-api");
        functionApp.Properties["connectedToNodeIds"].Should().Be("app-api");
    }

    [Fact]
    public async Task ParseAsync_promotes_aws_iam_attachment_role_and_policy_arn()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "aws-iam.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-mapper-aws",
            Content = """
                      resource "aws_iam_role_policy_attachment" "s3_full" {
                        role       = "pay_runner"
                        policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
                        scope      = "pay_bucket"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _parser.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject attachment = objects.Should().ContainSingle().Subject;
        attachment.Properties["principalId"].Should().Be("pay_runner");
        attachment.Properties["roleName"].Should().Be("amazons3fullaccess");
        attachment.Properties["declarationTargetResourceId"].Should().Be("pay_bucket");
    }

    [Fact]
    public async Task ParseAsync_promotes_gcp_iam_member_role_and_secret()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "gcp-iam.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-mapper-gcp",
            Content = """
                      resource "google_secret_manager_secret_iam_member" "runner_admin" {
                        member    = "pay_runner"
                        role      = "roles/secretmanager.admin"
                        secret_id = "pay-secret"
                        scope     = "pay_secret"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _parser.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject member = objects.Should().ContainSingle().Subject;
        member.Properties["principalId"].Should().Be("pay_runner");
        member.Properties["roleName"].Should().Be("roles/secretmanager.admin");
        member.Properties["declarationTargetResourceId"].Should().Be("pay_secret");
    }

    [Fact]
    public async Task ParseAsync_promotes_connected_to_and_lb_backend()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "data-flow.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-mapper-flow",
            Content = """
                      resource "aws_lb" "edge" {
                        name    = "edge-alb"
                        backend = "pay_api"
                      }
                      resource "aws_lambda_function" "pay_api" {
                        function_name = "pay-api"
                        connected_to  = "pay_sql"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _parser.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject loadBalancer = objects.Should().ContainSingle(o => o.Name == "edge").Subject;
        loadBalancer.Properties["declarationBackendNodeId"].Should().Be("pay_api");
        loadBalancer.Properties["connectedToNodeIds"].Should().Be("pay_api");

        CanonicalObject lambda = objects.Should().ContainSingle(o => o.Name == "pay_api").Subject;
        lambda.Properties["connectedToNodeIds"].Should().Be("pay_sql");
    }

    [Fact]
    public async Task ParseAsync_promotes_nsg_rule_blob_and_association_keys()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "nsg.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-mapper-nsg",
            Content = """
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
                      resource "azurerm_subnet_network_security_group_association" "edge_app" {
                        subnet_id                     = "app"
                        network_security_group_id     = "edge"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _parser.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject nsg = objects.Should().ContainSingle(o => o.Name == "edge").Subject;
        nsg.Properties.Should().ContainKey("tf.security_rule");
        nsg.Properties["tf.security_rule"].Should().Contain("source_address_prefix");
        nsg.Properties["tf.security_rule"].Should().Contain("22");
        nsg.Properties["declarationSegmentationRule"].Should().Be(nsg.Properties["tf.security_rule"]);

        CanonicalObject association = objects.Should().ContainSingle(o => o.Name == "edge_app").Subject;
        association.Properties["declarationSegmentationControlId"].Should().Be("edge");
        association.Properties["declarationAssociatedNodeId"].Should().Be("app");
    }
}
