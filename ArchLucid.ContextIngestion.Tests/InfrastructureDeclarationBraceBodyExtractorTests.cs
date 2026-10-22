using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class InfrastructureDeclarationBraceBodyExtractorTests
{
    private readonly SimpleTerraformDeclarationParser _terraformParser = new();

    [Fact]
    public async Task ParseAsync_SingleQuotedDoubledApostropheBeforeClosingBraceInNestedBlock_ParsesTrailingScalar()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-doubled-apostrophe-brace",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        site_config {
                          note = 'token''s } literal'
                          public_network_access = "Disabled"
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.public_network_access");
        parsed[0].Properties["tf.public_network_access"].Should().Be("disabled");
        parsed[0].Properties["tf.note"].Should().Be("token's } literal");
    }

    [Fact]
    public async Task ParseAsync_SingleQuotedDoubledApostropheInNestedBlock_ParsesTrailingScalar()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-doubled-apostrophe-nested",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        site_config {
                          note = 'owner''s rule'
                          public_network_access = "Disabled"
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.public_network_access");
        parsed[0].Properties["tf.public_network_access"].Should().Be("disabled");
        parsed[0].Properties["tf.note"].Should().Be("owner's rule");
    }

    [Fact]
    public async Task ParseAsync_SingleQuotedApostropheInArrayRuleName_ParsesIpAddress()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-single-quote-apostrophe",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [
                          {
                            name = 'O''Brien'
                            ip_address = '10.0.0.1'
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().ContainKey("tf.ip_security_restrictions");
        parsed[0].Properties["tf.ip_security_restrictions"].Should().Contain("10.0.0.1");
        parsed[0].Properties["tf.ip_security_restrictions"].Should().Contain("brien");
    }

    [Fact]
    public async Task ParseAsync_UnescapedSingleQuotedApostrophe_LeaksArrayScalarsToTopLevel()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-unescaped-apostrophe",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [
                          {
                            name = 'O'Brien'
                            ip_address = '10.0.0.1'
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle();
        parsed[0].Properties.Should().NotContainKey("tf.ip_security_restrictions");
        parsed[0].Properties.Should().ContainKey("tf.ip_address");
    }
}
