using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonPlannedValuesRootTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_planned_values_root_module_emits_canonical_resource()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "plan.json",
            Format = "terraform-show-json",
            DeclarationId = "plan-1",
            Content = """
                      {
                        "format_version": "1.2",
                        "planned_values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_resource_group.main",
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "name": "rg-a" }
                              }
                            ]
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["terraformType"].Should().Be("azurerm_resource_group");
    }
}
