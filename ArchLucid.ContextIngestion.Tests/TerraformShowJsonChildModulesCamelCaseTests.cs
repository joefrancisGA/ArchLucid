using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonChildModulesCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_camel_case_child_modules_extracts_nested_module_resources()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "terraformshowjsonchildmodulescamelcasetests.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "childModules": [
                              {
                                "address": "module.network",
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
        objects[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }
}
