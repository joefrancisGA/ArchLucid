using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class ArmJsonInfrastructureDeclarationParserTests
{
    private readonly ArmJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_SkipsNestedDeployments()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Resources/deployments",
                            "name": "nested",
                            "properties": {}
                          },
                          {
                            "type": "Microsoft.Storage/storageAccounts",
                            "name": "docs",
                            "properties": {
                              "allowBlobPublicAccess": true
                            }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("docs");
        result[0].Properties["tf.allowblobpublicaccess"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_EquivalentNumericRepresentations_ProduceSameTfProperties()
    {
        const string jsonInt = """
                               {
                                 "resources": [
                                   {
                                     "type": "Microsoft.Web/serverfarms",
                                     "name": "main",
                                     "properties": { "capacity": 1 }
                                   }
                                 ]
                               }
                               """;

        string jsonDecimal = jsonInt.Replace("\"capacity\": 1", "\"capacity\": 1.0");

        InfrastructureDeclarationReference intDeclaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "d-capacity",
            Content = jsonInt,
        };

        InfrastructureDeclarationReference decimalDeclaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "d-capacity",
            Content = jsonDecimal,
        };

        IReadOnlyList<CanonicalObject> intObjects = await _sut.ParseAsync(intDeclaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> decimalObjects = await _sut.ParseAsync(decimalDeclaration, CancellationToken.None);

        intObjects.Should().ContainSingle();
        decimalObjects.Should().ContainSingle();
        decimalObjects[0].Properties.Should().BeEquivalentTo(intObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_TfPropertyKeys_AreCanonicalized()
    {
        const string baseJson = """
                                {
                                  "resources": [
                                    {
                                      "type": "Microsoft.Storage/storageAccounts",
                                      "name": "docs",
                                      "properties": {
                                        "allowBlobPublicAccess": true,
                                        "minimumTlsVersion": "TLS1_2"
                                      }
                                    }
                                  ]
                                }
                                """;

        InfrastructureDeclarationReference firstKeyCasing = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "d-arm-keys",
            Content = baseJson,
        };

        InfrastructureDeclarationReference secondKeyCasing = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "d-arm-keys",
            Content = baseJson
                .Replace("\"allowBlobPublicAccess\"", "\"allowblobpublicaccess\"")
                .Replace("\"minimumTlsVersion\"", "\"minimumtlsversion\""),
        };

        IReadOnlyList<CanonicalObject> firstObjects = await _sut.ParseAsync(firstKeyCasing, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondObjects = await _sut.ParseAsync(secondKeyCasing, CancellationToken.None);

        firstObjects.Should().ContainSingle();
        secondObjects.Should().ContainSingle();
        secondObjects[0].Properties.Should().BeEquivalentTo(firstObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_Reparse_ProducesStableObjectId()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-stable",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Storage/storageAccounts",
                            "name": "docs",
                            "properties": {}
                          }
                        ]
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
    public async Task ParseAsync_CompositeSubnetNames_EmitsDistinctChildNames()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-composite-subnets",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Network/virtualNetworks/subnets",
                            "name": ["hub-vnet", "subnet-a"],
                            "properties": { "addressPrefix": "10.0.1.0/24" }
                          },
                          {
                            "type": "Microsoft.Network/virtualNetworks/subnets",
                            "name": ["hub-vnet", "subnet-b"],
                            "properties": { "addressPrefix": "10.0.2.0/24" }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(o => o.Name).Should().BeEquivalentTo(["hub-vnet/subnet-a", "hub-vnet/subnet-b"]);
        result.Select(o => o.ObjectId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseAsync_SameTypeNameDifferentProperties_EmitsDistinctObjectIds()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-duplicate-docs",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Storage/storageAccounts",
                            "name": "docs",
                            "properties": { "allowBlobPublicAccess": true }
                          },
                          {
                            "type": "Microsoft.Storage/storageAccounts",
                            "name": "docs",
                            "properties": { "allowBlobPublicAccess": false }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(o => o.ObjectId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseAsync_PascalCasePropertyNames_MapsStorageAccount()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-pascal",
            Content = """
                      {
                        "Resources": [
                          {
                            "Type": "Microsoft.Storage/storageAccounts",
                            "Name": "docs",
                            "Properties": {
                              "allowBlobPublicAccess": true
                            }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle(o => o.Name == "docs" && o.ObjectType == "TopologyResource");
        result[0].Properties["tf.allowblobpublicaccess"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_WebSiteWithIpSecurityRestrictions_PreservesRulesForNetworkExpander()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-appservice-network",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Web/sites",
                            "name": "web-app",
                            "properties": {
                              "ipSecurityRestrictions": [
                                {
                                  "name": "AllowAll",
                                  "ipAddress": "0.0.0.0/0",
                                  "action": "Allow"
                                }
                              ]
                            }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _sut.ParseAsync(declaration, CancellationToken.None);

        parsed.Should().ContainSingle(o => o.Name == "web-app");

        IReadOnlyList<CanonicalObject> expanded =
            AppServiceNetworkAccessSecurityBaselineExpander.Expand(parsed);

        expanded.Should().HaveCountGreaterThan(1);

        CanonicalObject? baseline = expanded.FirstOrDefault(o =>
            o.ObjectType == "SecurityBaseline"
            && o.Properties.TryGetValue("ruleKind", out string? kind)
            && kind == "OpenPublicEndpoint");

        baseline.Should().NotBeNull();
    }

    [Fact]
    public async Task ParseAsync_NestedChildResources_MapsSubnetUnderVnet()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-nested-subnet",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Network/virtualNetworks",
                            "name": "hub",
                            "properties": {},
                            "resources": [
                              {
                                "type": "Microsoft.Network/virtualNetworks/subnets",
                                "name": "subnet-a",
                                "properties": { "addressPrefix": "10.0.1.0/24" }
                              }
                            ]
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "hub");
        result.Should().ContainSingle(o => o.Name == "hub/subnet-a");
        result.Select(o => o.ObjectId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseAsync_ArrayPropertyInnerKeyCasing_IsCanonicalized()
    {
        const string camelCaseJson = """
                                     {
                                       "resources": [
                                         {
                                           "type": "Microsoft.Web/sites",
                                           "name": "web-app",
                                           "properties": {
                                             "ipSecurityRestrictions": [
                                               { "ipAddress": "0.0.0.0/0" }
                                             ]
                                           }
                                         }
                                       ]
                                     }
                                     """;

        string pascalCaseJson = camelCaseJson.Replace("\"ipAddress\"", "\"IpAddress\"");

        InfrastructureDeclarationReference camelCaseDeclaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-array-casing",
            Content = camelCaseJson,
        };

        InfrastructureDeclarationReference pascalCaseDeclaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-array-casing",
            Content = pascalCaseJson,
        };

        IReadOnlyList<CanonicalObject> camelCaseObjects = await _sut.ParseAsync(camelCaseDeclaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> pascalCaseObjects = await _sut.ParseAsync(pascalCaseDeclaration, CancellationToken.None);

        camelCaseObjects.Should().ContainSingle();
        pascalCaseObjects.Should().ContainSingle();
        pascalCaseObjects[0].Properties.Should().BeEquivalentTo(camelCaseObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_NestedConnectionStringInSiteConfig_IsRedacted()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-nested-sensitive",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Web/sites",
                            "name": "app",
                            "properties": {
                              "siteConfig": {
                                "connectionString": "postgres://user:pass@host/db"
                              }
                            }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.siteconfig"].Should().Be("{\"connectionstring\":\"[REDACTED]\"}");
    }

    [Fact]
    public async Task ParseAsync_DuplicatePropertyKeyCasing_UsesFirstValue()
    {
        const string firstOrderJson = """
                                      {
                                        "resources": [
                                          {
                                            "type": "Microsoft.Storage/storageAccounts",
                                            "name": "docs",
                                            "properties": {
                                              "allowBlobPublicAccess": true,
                                              "AllowBlobPublicAccess": false
                                            }
                                          }
                                        ]
                                      }
                                      """;

        string secondOrderJson = firstOrderJson
            .Replace("\"allowBlobPublicAccess\": true,\n              \"AllowBlobPublicAccess\": false",
                "\"AllowBlobPublicAccess\": false,\n              \"allowBlobPublicAccess\": true");

        InfrastructureDeclarationReference firstOrder = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-dup-keys",
            Content = firstOrderJson,
        };

        InfrastructureDeclarationReference secondOrder = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-dup-keys",
            Content = secondOrderJson,
        };

        IReadOnlyList<CanonicalObject> firstObjects = await _sut.ParseAsync(firstOrder, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondObjects = await _sut.ParseAsync(secondOrder, CancellationToken.None);

        firstObjects.Should().ContainSingle();
        secondObjects.Should().ContainSingle();
        secondObjects[0].Properties.Should().BeEquivalentTo(firstObjects[0].Properties);
    }
}
