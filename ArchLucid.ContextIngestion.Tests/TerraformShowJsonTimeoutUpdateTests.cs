using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonTimeoutUpdateTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_timeout_update_maps_tf_timeout_update_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "timeout-update.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","timeoutUpdate":"20m","mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.timeout_update"].Should().Be("20m");
    }
}
