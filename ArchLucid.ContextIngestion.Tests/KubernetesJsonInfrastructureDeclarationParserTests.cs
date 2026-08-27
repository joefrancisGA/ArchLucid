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
    public async Task ParseAsync_ProjectsPrivilegedDeploymentAndLoadBalancerService()
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
                            "metadata": { "name": "api", "namespace": "prod" },
                            "spec": {
                              "template": {
                                "spec": {
                                  "containers": [
                                    {
                                      "name": "api",
                                      "securityContext": { "privileged": true }
                                    }
                                  ]
                                }
                              }
                            }
                          },
                          {
                            "apiVersion": "v1",
                            "kind": "Service",
                            "metadata": { "name": "api-lb", "namespace": "prod" },
                            "spec": { "type": "LoadBalancer" }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject deployment = result.Should().ContainSingle(o => o.Name == "prod/api").Subject;
        deployment.Properties["k8s.privileged"].Should().Be("true");

        CanonicalObject service = result.Should().ContainSingle(o => o.Name == "prod/api-lb").Subject;
        service.Properties["k8s.servicetype"].Should().Be("loadbalancer");
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
    public async Task ParseAsync_TopLevelResourceArray_MapsMultipleKinds()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-array.json",
            Format = "kubernetes-json",
            Content = """
                      [
                        {
                          "apiVersion": "apps/v1",
                          "kind": "Deployment",
                          "metadata": { "name": "api", "namespace": "prod" }
                        },
                        {
                          "apiVersion": "v1",
                          "kind": "Service",
                          "metadata": { "name": "api", "namespace": "prod" }
                        }
                      ]
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.Properties["k8s.kind"] == "deployment");
        result.Should().ContainSingle(o => o.Name == "prod/api" && o.Properties["k8s.kind"] == "service");
    }
}
