using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonResourceAddressCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_camel_case_resource_address_uses_explicit_address_when_name_collides()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "resource-address-camel.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "resourceAddress": "azurerm_resource_group.main[1]",
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "index": 1,
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "mode": "managed",
                                "values": { "name": "rg-b" }
                              },
                              {
                                "resourceAddress": "azurerm_resource_group.main[0]",
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "index": 0,
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "mode": "managed",
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
        objects.Select(o => o.Name).Should().BeEquivalentTo(
            "azurerm_resource_group.main[0]",
            "azurerm_resource_group.main[1]");
    }
}
