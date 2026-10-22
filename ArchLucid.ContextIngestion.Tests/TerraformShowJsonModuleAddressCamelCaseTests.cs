using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonModuleAddressCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_camel_case_module_address_prefixes_nested_module_resource_names()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "terraformshowjsonmoduleaddresscamelcasetests.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "child_modules": [
                              {
                                "moduleAddress": "module.network",
                                "resources": [
                                  {
                                    "type": "azurerm_virtual_network",
                                    "name": "main",
                                    "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                    "mode": "managed",
                                    "values": { "name": "vnet" }
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("module.network.azurerm_virtual_network.main");
    }
}
