using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterEmptyObjectArrayTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_EmptyObjectInIpSecurityRestrictionsArray_PreservesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-empty-object-array",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [{}]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.ip_security_restrictions");
        parsed[0].Properties["tf.ip_security_restrictions"].Should().Be("[{}]");
    }

    [Fact]
    public async Task ParseAsync_TwoEmptyObjectsInSecurityArray_PreservesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-two-empty-object-array",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [{}, {}]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties["tf.ip_security_restrictions"].Should().Be("[{},{}]");
    }
}
