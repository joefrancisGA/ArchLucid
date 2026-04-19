using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

public sealed class TerraformShowJsonInfrastructureDeclarationParserTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_extracts_root_module_resources()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
            {
              "format_version": "1.0",
              "values": {
                "root_module": {
                  "resources": [
                    {
                      "address": "azurerm_resource_group.main",
                      "mode": "managed",
                      "type": "azurerm_resource_group",
                      "name": "main",
                      "provider_name": "registry.terraform.io/hashicorp/azurerm",
                      "values": { "location": "eastus", "name": "rg-demo" }
                    }
                  ]
                }
              }
            }
            """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        CanonicalObject o = objects[0];
        o.ObjectType.Should().Be("TopologyResource");
        o.Name.Should().Be("azurerm_resource_group.main");
        o.Properties.Should().ContainKey("terraformType");
        o.Properties["terraformType"].Should().Be("azurerm_resource_group");
        o.Properties.Should().ContainKey("tf.location");
    }

    [Fact]
    public async Task ParseAsync_maps_key_vault_to_security_baseline()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d2",
            Content = """
            {
              "values": {
                "root_module": {
                  "resources": [
                    {
                      "type": "azurerm_key_vault",
                      "name": "core",
                      "provider_name": "registry.terraform.io/hashicorp/azurerm",
                      "mode": "managed",
                      "values": { "name": "kv1" }
                    }
                  ]
                }
              }
            }
            """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_empty_values_returns_empty()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "bad",
            Format = "terraform-show-json",
            DeclarationId = "d3",
            Content = "{}"
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().BeEmpty();
    }
}
