using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonResourceAddressSnakeCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_resource_address_uses_explicit_address_when_name_collides()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "resource-address-snake.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "resource_address": "azurerm_resource_group.main[1]",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "name": "rg-b" }
                              },
                              {
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "resource_address": "azurerm_resource_group.main[0]",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "name": "rg-a" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().HaveCount(2);
        objects.Should().Contain(o => o.Name == "azurerm_resource_group.main[0]");
        objects.Should().Contain(o => o.Name == "azurerm_resource_group.main[1]");
    }
}
