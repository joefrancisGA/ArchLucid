using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonDependsOnCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_camel_case_depends_on_projects_terraform_depends_on_exposure()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "terraformshowjsondependsoncamelcasetests.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_storage_account",
                                "name": "data",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "dependsOn": ["azurerm_resource_group.main"],
                                "values": { "name": "stdata" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["terraformDependsOn"].Should().Be("azurerm_resource_group.main");
    }
}
