using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonResourceIndexWithoutAddressTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_numeric_index_without_resource_address_appends_index_suffix_to_name()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "resource-index-without-address.json",
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
                                "index": 1,
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "mode": "managed",
                                "values": { "name": "rg-b" }
                              },
                              {
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
