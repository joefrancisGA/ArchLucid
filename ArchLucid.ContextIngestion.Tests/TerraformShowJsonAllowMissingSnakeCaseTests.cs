using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformShowJsonAllowMissingSnakeCaseTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_allow_missing_maps_tf_allow_missing_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "allow-missing-snake.json",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","allow_missing":true,"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.allow_missing"].Should().Be("true");
    }
}
