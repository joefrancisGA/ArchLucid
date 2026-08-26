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
}
