using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonForEachKeyTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_for_each_appends_for_each_suffix_to_name()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "for-each-key.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","for_each":"east","mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-east"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("azurerm_resource_group.main[east]");
    }
}
