using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class BicepInfrastructureDeclarationParserTests
{
    private readonly BicepInfrastructureDeclarationParser _sut = new();

    [Fact]
    public async Task ParseAsync_ExtractsBicepResources()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "storage" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "kv" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_ignores_quoted_symbolic_names_because_bicep_requires_identifiers()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource 'storage' 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_Reparse_ProducesStableObjectId()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-stable",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> firstParse = await _sut.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondParse = await _sut.ParseAsync(declaration, CancellationToken.None);

        firstParse.Should().ContainSingle();
        secondParse.Should().ContainSingle();
        secondParse[0].ObjectId.Should().Be(firstParse[0].ObjectId);
    }

    [Fact]
    public async Task ParseAsync_ExtractsPublicNetworkAccessFromPropertiesBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled'
                          allowBlobPublicAccess: true
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
        result[0].Properties["publicNetworkAccess"].Should().Be("enabled");
        result[0].Properties["tf.allowblobpublicaccess"].Should().Be("true");
        result[0].Properties["allowBlobPublicAccess"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_InlineHashComment_DoesNotChangeTfPublicNetworkAccess()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled' # primary region
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
    }

    [Fact]
    public async Task ParseAsync_HclEqualsScalarAssignment_ParsesTfProperty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess = 'Enabled'
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
        result[0].Properties["publicNetworkAccess"].Should().Be("enabled");
    }

    [Fact]
    public async Task ParseAsync_HclEqualsArrayHeader_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions = [
                              { name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_HclEqualsNestedBlockHeader_PreservesNetworkAclsBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          networkAcls = {
                            defaultAction: 'Deny'
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.networkacls"].Should().Contain("deny");
        result[0].Properties.Should().NotContainKey("tf.defaultaction");
    }

    [Fact]
    public async Task ParseAsync_InlineHashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions = # legacy rules [{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineSlashSlashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions = // legacy rules [{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineBlockCommentBeforeArrayBracket_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions = /* legacy rules */ [{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_InlineHashCommentBeforeNestedBlockBrace_PreservesNetworkAclsBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          networkAcls = # deny by default { defaultAction: 'Deny' }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.networkacls"].Should().Contain("deny");
        result[0].Properties.Should().NotContainKey("tf.defaultaction");
    }

    [Fact]
    public async Task ParseAsync_InlineBlockCommentBeforeNestedBlockBrace_PreservesNetworkAclsBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          networkAcls = /* deny by default */ { defaultAction: 'Deny' }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.networkacls"].Should().Contain("deny");
        result[0].Properties.Should().NotContainKey("tf.defaultaction");
    }

    [Fact]
    public async Task ParseAsync_InlineSlashSlashComment_DoesNotChangeTfPublicNetworkAccess()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled' // primary region
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
    }

    [Fact]
    public async Task ParseAsync_PropertyChanges_DoNotChangeObjectId()
    {
        InfrastructureDeclarationReference enabled = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-public",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled'
                        }
                      }
                      """
        };

        InfrastructureDeclarationReference disabled = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-public",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Disabled'
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> enabledObjects = await _sut.ParseAsync(enabled, CancellationToken.None);
        IReadOnlyList<CanonicalObject> disabledObjects = await _sut.ParseAsync(disabled, CancellationToken.None);

        enabledObjects.Should().ContainSingle();
        disabledObjects.Should().ContainSingle();
        disabledObjects[0].ObjectId.Should().Be(enabledObjects[0].ObjectId);
    }

    [Fact]
    public async Task ParseAsync_DuplicateSymbolicNamesDifferentApiVersions_EmitDistinctObjectIds()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-duplicate-storage",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(o => o.ObjectId).Distinct().Should().HaveCount(2);
        result.Should().OnlyContain(o => o.Properties.ContainsKey("bicepOccurrence"));
    }

    [Fact]
    public async Task ParseAsync_BlockCommentBeforeAssignment_StillParsesPublicNetworkAccess()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          /* skip */
                          publicNetworkAccess: 'Enabled'
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
    }

    [Fact]
    public async Task ParseAsync_InlineSingleLineArray_PreservesIpSecurityRestrictions()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions: [{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
    }

    [Fact]
    public async Task ParseAsync_InlineSingleLineArray_ExpandsNetworkBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-inline-array-network",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions: [{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]
                          }
                        }
                      }
                      """
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
    public async Task ParseAsync_AppServiceIpSecurityRestrictionsArray_IsPreservedForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions: [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArray_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions:
                            [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ipaddress");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArrayWithHashCommentLine_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions:
                            # legacy
                            [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ipaddress");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArrayWithSlashSlashCommentLine_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions:
                            // legacy
                            [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ipaddress");
    }

    [Fact]
    public async Task ParseAsync_MultilineIpSecurityRestrictionsArrayWithBlockCommentBeforeBracket_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions:
                            /* legacy */
                            [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ipaddress");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigWithEscapedQuoteBeforeClosingBrace_StillParsesTrailingScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            note: "has \"} char"
                            publicNetworkAccess: 'Disabled'
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be(@"has ""} char");
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("disabled");
    }

    [Fact]
    public async Task ParseAsync_NestedSiteConfigWithClosingBraceInQuotedString_StillParsesTrailingScalars()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            note: 'policy } marker'
                            publicNetworkAccess: 'Disabled'
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.note"].Should().Be("policy } marker");
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("disabled");
    }

    [Fact]
    public async Task ParseAsync_IpSecurityRestrictionsArrayWithBracketInLineComment_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions: [ // legacy rule ]
                            {
                              name: 'AllowAll'
                              ipAddress: '0.0.0.0/0'
                              action: 'Allow'
                            }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.ipsecurityrestrictions"].Should().Contain("0.0.0.0/0");
        result[0].Properties.Should().NotContainKey("tf.name");
        result[0].Properties.Should().NotContainKey("tf.ipaddress");
    }

    [Fact]
    public async Task ParseAsync_AppServiceIpSecurityRestrictionsArray_ExpandsNetworkBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-appservice-network",
            Content = """
                      resource app 'Microsoft.Web/sites@2022-03-01' = {
                        properties: {
                          siteConfig: {
                            ipSecurityRestrictions: [
                              {
                                name: 'AllowAll'
                                ipAddress: '0.0.0.0/0'
                                action: 'Allow'
                              }
                            ]
                          }
                        }
                      }
                      """
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
    public async Task ParseAsync_InlineBlockCommentAfterValue_ParsesCleanPublicNetworkAccess()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled' /* primary region */
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
    }
}
