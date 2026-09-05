using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Simple Terraform Declaration Parser.
/// </summary>
[Trait("Suite", "Core")]
public sealed class SimpleTerraformDeclarationParserTests
{
    private readonly SimpleTerraformDeclarationParser _sut = new();

    [Fact]
    public async Task ParseAsync_TrimsPaddedResourceName()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_virtual_network\" \" hub-vnet \"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task ParseAsync_TerraformTypeCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_Virtual_Network\" \"core\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ResourceNameCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_virtual_network\" \"Hub-Vnet\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task ParseAsync_TrimsPaddedResourceType()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \" azurerm_virtual_network \" \"core\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ExtractsResourceBlocks()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "stub.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_virtual_network" "core"
                      resource "azurerm_subnet" "app"
                      resource "azurerm_storage_account" "docs"
                      resource "azurerm_linux_web_app" "api"
                      resource "azurerm_key_vault" "kv"
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(5);
        result.Should().ContainSingle(o => o.Name == "kv" && o.ObjectType == "SecurityBaseline");
        result.Should().ContainSingle(o =>
            o.Name == "core" && o.Properties["terraformType"] == "azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ExtractsAwsAndGcpResourceBlocks()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "multi.tf",
            Format = "simple-terraform",
            Content = """
                      resource "aws_vpc" "core"
                      resource "aws_security_group" "web"
                      resource "google_compute_firewall" "allow_https"
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(3);
        result.Should().ContainSingle(o => o.Name == "core" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "web" && o.ObjectType == "SecurityBaseline");
        result.Should().ContainSingle(o =>
            o.Name == "allow_https" && o.Properties["terraformType"] == "google_compute_firewall");
    }

    [Fact]
    public async Task ParseAsync_CapturesScalarAttributesOnTfProperties()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "storage.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_storage_account" "docs" {
                        public_network_access = "Enabled"
                        https_only = true
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.public_network_access"].Should().Be("enabled");
        result[0].Properties["tf.https_only"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_RedactsSensitiveAssignments()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "secret.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_storage_account" "docs" {
                        access_key = "supersecret"
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.access_key"].Should().Be("[REDACTED]");
    }

    [Fact]
    public async Task ParseAsync_Reparse_ProducesStableObjectId()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-stable",
            Content = "resource \"azurerm_virtual_network\" \"hub-vnet\"\n"
        };

        IReadOnlyList<CanonicalObject> firstParse = await _sut.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondParse = await _sut.ParseAsync(declaration, CancellationToken.None);

        firstParse.Should().ContainSingle();
        secondParse.Should().ContainSingle();
        secondParse[0].ObjectId.Should().Be(firstParse[0].ObjectId);
    }

    [Fact]
    public async Task ParseAsync_DuplicateResourceBlocksSameTypeLabel_EmitsDistinctObjects()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "dup.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-tf-dup",
            Content = """
                      resource "azurerm_subnet" "app" {
                        address_prefixes = ["10.0.1.0/24"]
                      }
                      resource "azurerm_subnet" "app" {
                        address_prefixes = ["10.0.2.0/24"]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(static o => o.ObjectId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseAsync_SingleQuotedResourceHeader_MapsResource()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource 'azurerm_virtual_network' 'hub-vnet'\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
        result[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_NestedBlock_DoesNotEmitDuplicateTopLevelScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "storage.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_storage_account" "docs" {
                        site_config {
                          public_network_access = "Disabled"
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.public_network_access"].Should().Be("disabled");
        result[0].Properties.Should().NotContainKey("tf.site_config");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigIpSecurityRestrictionsArray_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        site_config {
                          ip_security_restrictions = [
                            {
                              name       = "AllowAll"
                              ip_address = "0.0.0.0/0"
                              action     = "Allow"
                            }
                          ]
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.site_config");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigWithClosingBraceInQuotedString_StillParsesTrailingScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        site_config {
                          note = "has } char"
                          public_network_access = "Disabled"
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be("has } char");
        result[0].Properties["tf.public_network_access"].Should().Be("disabled");
        result[0].Properties.Should().NotContainKey("tf.site_config");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigIpSecurityRestrictionsArray_ExpandsNetworkBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-hcl-appservice-nested-network",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        site_config {
                          ip_security_restrictions = [
                            {
                              name       = "AllowAll"
                              ip_address = "0.0.0.0/0"
                              action     = "Allow"
                            }
                          ]
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> parsed = await _sut.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        expanded.Should().HaveCountGreaterThan(1);

        CanonicalObject? baseline = expanded.FirstOrDefault(o =>
            o.ObjectType == "SecurityBaseline"
            && o.Properties.TryGetValue("ruleKind", out string? kind)
            && kind == "OpenPublicEndpoint");

        baseline.Should().NotBeNull();
    }

    [Fact]
    public async Task ParseAsync_InlineHashComment_DoesNotChangeTfLocation()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_resource_group" "rg" {
                        location = "eastus" # primary region
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.location"].Should().Be("eastus");
    }

    [Fact]
    public async Task ParseAsync_InlineSlashSlashComment_DoesNotChangeTfLocation()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_resource_group" "rg" {
                        location = "eastus" // primary region
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.location"].Should().Be("eastus");
    }

    [Fact]
    public async Task ParseAsync_EscapedQuoteBeforeHash_DoesNotTruncateScalarValue()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_resource_group" "rg" {
                        note = "eastus\" # region"
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be("eastus\" # region");
    }

    [Fact]
    public async Task ParseAsync_BlockCommentBeforeAssignment_StillParsesLocation()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_resource_group" "core" {
                        /* skip */
                        location = "eastus"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.location"].Should().Be("eastus");
    }

    [Fact]
    public async Task ParseAsync_InlineBlockCommentAfterValue_ParsesCleanLocation()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_resource_group" "core" {
                        location = "eastus" /* zone */
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.location"].Should().Be("eastus");
    }

    [Fact]
    public async Task ParseAsync_IpSecurityRestrictionsArray_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = [
                          {
                            name       = "AllowAll"
                            ip_address = "0.0.0.0/0"
                            action     = "Allow"
                          }
                        ]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArray_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions =
                        [
                          {
                            name       = "AllowAll"
                            ip_address = "0.0.0.0/0"
                            action     = "Allow"
                          }
                        ]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ip_address");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArrayWithBlockCommentBeforeBracket_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions =
                        /* legacy */
                        [
                          {
                            name       = "AllowAll"
                            ip_address = "0.0.0.0/0"
                            action     = "Allow"
                          }
                        ]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ip_address");
    }

    [Fact]
    public async Task ParseAsync_IpSecurityRestrictionsArrayWithBracketInLineComment_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = [ // legacy rule ]
                        {
                          name       = "AllowAll"
                          ip_address = "0.0.0.0/0"
                          action     = "Allow"
                        }
                        ]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ip_address");
    }

    [Fact]
    public async Task ParseAsync_InlineHashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = # legacy rules [{ name = "AllowAll", ip_address = "0.0.0.0/0", action = "Allow" }]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineSlashSlashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = // legacy rules [{ name = "AllowAll", ip_address = "0.0.0.0/0", action = "Allow" }]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineBlockCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = /* legacy rules */ [{ name = "AllowAll", ip_address = "0.0.0.0/0", action = "Allow" }]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ip_security_restrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineHashCommentBeforeNestedBlockBrace_PreservesRetentionPolicyBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_log_analytics_workspace" "logs" {
                        retention_policy # keep logs {
                          days = 30
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.retention_policy"].Should().Contain("30");
        result[0].Properties.Should().NotContainKey("tf.days");
    }

    [Fact]
    public async Task ParseAsync_InlineBlockCommentBeforeNestedBlockBrace_PreservesRetentionPolicyBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_log_analytics_workspace" "logs" {
                        retention_policy /* keep logs */ {
                          days = 30
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.retention_policy"].Should().Contain("30");
        result[0].Properties.Should().NotContainKey("tf.days");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigWithEscapedQuoteBeforeClosingBrace_StillParsesTrailingScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        site_config {
                          note = "has \"} char"
                          public_network_access = "Disabled"
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be(@"has ""} char");
        result[0].Properties["tf.public_network_access"].Should().Be("disabled");
        result[0].Properties.Should().NotContainKey("tf.site_config");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigWithClosingBraceInLineComment_StillParsesTrailingScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        site_config { // legacy block }
                          public_network_access = "Disabled"
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.public_network_access"].Should().Be("disabled");
    }

    [Fact]
    public async Task ParseAsync_IpSecurityRestrictionsArray_ExpandsNetworkBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "app.tf",
            Format = "simple-terraform",
            DeclarationId = "decl-hcl-appservice-network",
            Content = """
                      resource "azurerm_linux_web_app" "app" {
                        ip_security_restrictions = [
                          {
                            name       = "AllowAll"
                            ip_address = "0.0.0.0/0"
                            action     = "Allow"
                          }
                        ]
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> parsed = await _sut.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        expanded.Should().HaveCountGreaterThan(1);

        CanonicalObject? baseline = expanded.FirstOrDefault(o =>
            o.ObjectType == "SecurityBaseline"
            && o.Properties.TryGetValue("ruleKind", out string? kind)
            && kind == "OpenPublicEndpoint");

        baseline.Should().NotBeNull();
    }
}
