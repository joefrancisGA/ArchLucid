using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class KubernetesJsonInfrastructureDeclarationParserTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_MapsDeploymentAndNetworkPolicy()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "v1",
                        "kind": "List",
                        "items": [
                          {
                            "apiVersion": "apps/v1",
                            "kind": "Deployment",
                            "metadata": { "name": "api", "namespace": "prod" }
                          },
                          {
                            "apiVersion": "networking.k8s.io/v1",
                            "kind": "NetworkPolicy",
                            "metadata": { "name": "deny-all", "namespace": "prod" }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "prod/deny-all" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_SecretOmitsDataPayload()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "secret.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "v1",
                        "kind": "Secret",
                        "metadata": { "name": "db" },
                        "data": { "token": "abc" }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("SecurityBaseline");
        result[0].Properties.Should().NotContainKey("data");
    }

    [Fact]
    public async Task ParseAsync_LowercaseKind_ClassifiesSecretAsSecurityBaseline()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "secret.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "v1",
                        "kind": "secret",
                        "metadata": { "name": "db" }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("SecurityBaseline");
        result[0].Properties["k8s.kind"].Should().Be("secret");
    }

    [Fact]
    public async Task ParseAsync_reparse_produces_stable_object_ids_for_deployments()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster.json",
            Format = "kubernetes-json",
            DeclarationId = "decl-k8s-stable",
            Content = """
                      {
                        "apiVersion": "v1",
                        "kind": "List",
                        "items": [
                          {
                            "apiVersion": "apps/v1",
                            "kind": "Deployment",
                            "metadata": { "name": "api", "namespace": "prod" }
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
    public async Task ParseAsync_GenerateNameOnly_MapsJob()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "job.json",
            Format = "kubernetes-json",
            DeclarationId = "decl-k8s-generatename",
            Content = """
                      {
                        "apiVersion": "batch/v1",
                        "kind": "Job",
                        "metadata": {
                          "generateName": "batch-",
                          "namespace": "prod"
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("prod/batch-");
        result[0].Properties["k8s.name"].Should().Be("batch-");
    }
}
