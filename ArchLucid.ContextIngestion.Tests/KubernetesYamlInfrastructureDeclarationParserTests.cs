using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class KubernetesYamlInfrastructureDeclarationParserTests
{
    private readonly KubernetesYamlInfrastructureDeclarationParser _sut =
        new(NullLogger<KubernetesYamlInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_PascalCaseKeys_MapsDeployment()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "pascal.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-pascal",
            Content = """
                      ApiVersion: apps/v1
                      Kind: Deployment
                      Metadata:
                        Name: api
                        Namespace: prod
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle(o =>
            o.Name == "prod/api"
            && o.ObjectType == "TopologyResource"
            && o.Properties["k8s.kind"] == "deployment");
    }
}
