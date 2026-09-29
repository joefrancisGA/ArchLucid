using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonProviderNameSnakeCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_provider_name_projects_provider_name_exposure()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "provider-name-snake.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_resource_group.main",
                                "mode": "managed",
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "location": "eastus", "name": "rg-demo" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["providerName"].Should().Be("registry.terraform.io/hashicorp/azurerm");
    }
}
