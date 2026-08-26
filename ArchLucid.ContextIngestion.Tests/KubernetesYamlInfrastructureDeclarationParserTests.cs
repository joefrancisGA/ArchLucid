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
    public async Task ParseAsync_LowercaseKindValue_ClassifiesSecretAsSecurityBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "secret.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-secret",
            Content = """
                      apiVersion: v1
                      kind: secret
                      metadata:
                        name: db
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("SecurityBaseline");
    }

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

    [Fact]
    public async Task ParseAsync_KindList_MapsMultipleItems()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "list.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-list",
            Content = """
                      apiVersion: v1
                      kind: List
                      items:
                        - apiVersion: apps/v1
                          kind: Deployment
                          metadata:
                            name: api
                            namespace: prod
                        - apiVersion: networking.k8s.io/v1
                          kind: NetworkPolicy
                          metadata:
                            name: deny-all
                            namespace: prod
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "prod/deny-all" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_BareYamlArrayRoot_MapsBothItems()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "bundle.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-bare-array",
            Content = """
                      - apiVersion: v1
                        kind: Pod
                        metadata:
                          name: pod-a
                      - apiVersion: v1
                        kind: Service
                        metadata:
                          name: svc-a
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "pod-a" && o.Properties["k8s.kind"] == "pod");
        result.Should().ContainSingle(o => o.Name == "svc-a" && o.Properties["k8s.kind"] == "service");
    }
}
