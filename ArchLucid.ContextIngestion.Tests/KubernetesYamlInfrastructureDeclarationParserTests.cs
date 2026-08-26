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
    public async Task ParseAsync_MultiDocWithPaddedDocumentSeparator_MapsAllDocuments()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "multi.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-sep",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: prod
                       ---
                      apiVersion: v1
                      kind: Secret
                      metadata:
                        name: db
                        namespace: prod
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "prod/db" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_BareArrayDocument_MapsMultipleItems()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "bundle.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-yaml-array",
            Content = """
                      ---
                      - apiVersion: apps/v1
                        kind: Deployment
                        metadata:
                          name: api
                          namespace: prod
                      - apiVersion: v1
                        kind: Service
                        metadata:
                          name: api
                          namespace: prod
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.Properties["k8s.kind"] == "deployment");
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.Properties["k8s.kind"] == "service");
    }
}
