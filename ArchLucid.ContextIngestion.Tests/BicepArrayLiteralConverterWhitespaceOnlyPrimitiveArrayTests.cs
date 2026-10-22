using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterWhitespaceOnlyPrimitiveArrayTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_WhitespaceOnlyPrimitiveStringAddressPrefixesArray_PreservesEmptyTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "subnet.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-whitespace-only-address-prefixes",
            Content = """
                      resource "azurerm_subnet" "app" {
                        address_prefixes = ["  ", ""]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.address_prefixes");
        parsed[0].Properties["tf.address_prefixes"].Should().Be("[]");
    }
}
