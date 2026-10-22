using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonSensitiveValuesCamelCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_camel_case_sensitive_values_redacts_top_level_sensitive_tf_values()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "terraformshowjsonsensitivevaluescamelcasetests.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "x",
                                "values": { "admin_secret": "hidden" },
                                "sensitiveValues": { "admin_secret": true }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.admin_secret"].Should().Be("[REDACTED]");
    }
}
