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
}
