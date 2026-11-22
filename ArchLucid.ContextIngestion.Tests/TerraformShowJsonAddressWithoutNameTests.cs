using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonAddressWithoutNameTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_address_without_name_derives_label_from_address()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "address-without-name.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_resource_group.main",
                                "type": "azurerm_resource_group",
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

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("azurerm_resource_group.main");
    }

    [Theory]
    [InlineData("azurerm_federated_identity_credential.main[\"east.us\"]")]
    [InlineData("module.env[\"west.eu\"].azurerm_federated_identity_credential.main[\"east.us[blue]\"]")]
    [InlineData("module.env[\"west.eu\"].azurerm_federated_identity_credential.main[\"east.\\\"us\"]")]
    [InlineData("module.env[\"west.eu\"].azurerm_federated_identity_credential.main[0]")]
    public async Task ParseAsync_indexed_address_without_name_preserves_resource_label(string address)
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "indexed-address-without-name.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = $$"""
                        {
                          "values": {
                            "root_module": {
                              "resources": [
                                {
                                  "address": {{System.Text.Json.JsonSerializer.Serialize(address)}},
                                  "type": "azurerm_federated_identity_credential",
                                  "mode": "managed",
                                  "values": {}
                                }
                              ]
                            }
                          }
                        }
                        """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be(address);
        objects[0].Properties.Should().Contain("federatedCredentialName", "main");
    }
}
