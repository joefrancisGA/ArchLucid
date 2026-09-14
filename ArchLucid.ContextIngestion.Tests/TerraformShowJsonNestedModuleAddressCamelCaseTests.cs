using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonNestedModuleAddressCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_nested_camel_case_child_modules_and_module_address_prefixes_resource_names()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "terraformshowjsonnestedmoduleaddresscamelcasetests.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "rootModule": {
                            "childModules": [
                              {
                                "moduleAddress": "module.network",
                                "childModules": [
                                  {
                                    "moduleAddress": "module.network.subnet",
                                    "resources": [
                                      {
                                        "type": "azurerm_subnet",
                                        "name": "internal",
                                        "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                        "mode": "managed",
                                        "values": { "name": "internal" }
                                      }
                                    ]
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
        objects[0].Name.Should().Be("module.network.subnet.azurerm_subnet.internal");
    }
}
