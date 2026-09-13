using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class KubernetesJsonMetadataSnakeCaseTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_meta_data_key_resolves_resource_name()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-meta.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "meta_data": { "name": "api", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "containers": [
                                {
                                  "name": "api",
                                  "image": "nginx"
                                }
                              ]
                            }
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
    }
}
