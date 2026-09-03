using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class BicepArrayLiteralConverterTests
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

    [Fact]
    public async Task ParseAsync_InlineCommaSeparatedArrayObject_ExpandsNetworkBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-inline-array-network",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [{ name = "AllowAll", ip_address = "0.0.0.0/0", action = "Allow" }]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        expanded.Should().HaveCountGreaterThan(1);

        CanonicalObject? baseline = expanded.FirstOrDefault(o =>
            o.ObjectType == "SecurityBaseline"
            && o.Properties.TryGetValue("ruleKind", out string? kind)
            && kind == "OpenPublicEndpoint");

        baseline.Should().NotBeNull();
    }

    [Fact]
    public async Task ParseAsync_InlineArrayObjectWithFullLineHashComment_DoesNotParseCommentedAssignment()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-full-line-hash-comment",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [
                          {
                            name = "AllowAll"
                            # ip_address = "1.1.1.1"
                            ip_address = "0.0.0.0/0"
                            action = "Allow"
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _terraformParser.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        expanded.Should().HaveCountGreaterThan(1);
        parsed[0].Properties["tf.ip_security_restrictions"].Should().NotContain("1.1.1.1");
    }

    [Fact]
    public async Task ParseAsync_ArrayObjectBlockCommentInsideQuotedName_PreservesLiteralText()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-quoted-block-comment",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        ip_security_restrictions = [
                          {
                            name = "Allow /* not a comment */ All"
                            ip_address = "0.0.0.0/0"
                            action = "Allow"
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"]
            .Should().Contain("allow /* not a comment */ all");
    }

    [Fact]
    public async Task ParseAsync_BodyScalarBlockCommentInsideQuotedValue_PreservesLiteralText()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-body-quoted-block-comment",
            Content = """
                      resource "azurerm_linux_web_app" "api" {
                        note = "Allow /* not a comment */ All"
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _terraformParser.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be("allow /* not a comment */ all");
    }
}
