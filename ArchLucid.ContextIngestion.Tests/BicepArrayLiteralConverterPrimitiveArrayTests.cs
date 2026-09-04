using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterPrimitiveArrayTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_PrimitiveStringIpSecurityRestrictionsArray_DoesNotEmitTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-primitive-ip-rules",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = ["0.0.0.0/0"]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().NotContainKey("tf.ip_security_restrictions");
        expanded.Should().ContainSingle("malformed object-only arrays are not valid ip_security_restrictions HCL");
    }

    [Fact]
    public async Task ParseAsync_PrimitiveStringAddressPrefixesArray_PreservesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "subnet.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-primitive-address-prefixes",
            Content = """
                      resource "azurerm_subnet" "app" {
                        address_prefixes = ["10.0.1.0/24"]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.address_prefixes");
        parsed[0].Properties["tf.address_prefixes"].Should().Contain("10.0.1.0/24");
    }

    [Fact]
    public async Task ParseAsync_PrimitiveStringAddressPrefixesArray_PreservesMultipleValues()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "subnet.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-primitive-address-prefixes-multi",
            Content = """
                      resource "azurerm_subnet" "app" {
                        address_prefixes = ["10.0.1.0/24", "10.0.2.0/24"]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties["tf.address_prefixes"].Should().Contain("10.0.1.0/24");
        parsed[0].Properties["tf.address_prefixes"].Should().Contain("10.0.2.0/24");
    }

    [Fact]
    public async Task ParseAsync_BicepPrimitiveStringAddressPrefixesArray_PreservesTfProperty()
    {
        BicepInfrastructureDeclarationParser bicepParser = new();
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "subnet.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-primitive-address-prefixes",
            Content = """
                      resource subnet 'Microsoft.Network/virtualNetworks/subnets@2021-02-01' = {
                        name: 'app'
                        properties: {
                          addressPrefixes: ['10.0.1.0/24']
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await bicepParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.addressprefixes");
        parsed[0].Properties["tf.addressprefixes"].Should().Contain("10.0.1.0/24");
    }
}
