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
}
