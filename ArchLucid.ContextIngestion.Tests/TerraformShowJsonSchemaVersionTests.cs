using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonSchemaVersionTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_schema_version_maps_tf_schema_version_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "schema-version.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","schemaVersion":2,"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.schema_version"].Should().Be("2");
    }
}
