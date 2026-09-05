using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterNumericPrimitiveArrayTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_NumericPrimitiveAddressPrefixesArray_PreservesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "subnet.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-numeric-address-prefixes",
            Content = """
                      resource "azurerm_subnet" "app" {
                        service_endpoints = [10, 20]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.service_endpoints");
        parsed[0].Properties["tf.service_endpoints"].Should().Contain("10");
        parsed[0].Properties["tf.service_endpoints"].Should().Contain("20");
    }

    [Fact]
    public async Task ParseAsync_BooleanPrimitiveArray_PreservesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "flags.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-boolean-flags",
            Content = """
                      resource "azurerm_subnet" "app" {
                        service_endpoints = [true, false]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.service_endpoints");
        parsed[0].Properties["tf.service_endpoints"].Should().Contain("true");
        parsed[0].Properties["tf.service_endpoints"].Should().Contain("false");
    }
}
