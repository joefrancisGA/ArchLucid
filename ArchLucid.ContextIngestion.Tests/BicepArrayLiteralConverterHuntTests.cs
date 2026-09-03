using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterHuntTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_IpSecurityRestrictionsArrayWithBlockCommentedProperty_DoesNotParseCommentedScalar()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [
                          {
                            name = "AllowAll"
                            /*
                            ip_address = "1.1.1.1"
                            */
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties.Should().ContainKey("tf.ip_security_restrictions");
        result[0].Properties["tf.ip_security_restrictions"].Should().NotContain("1.1.1.1");
    }
}
