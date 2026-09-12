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
    public async Task ParseAsync_snake_case_security_context_projects_privileged_container()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-snake.json",
            Format = "kubernetes-json",
            Content = """
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
                                  "security_context": { "privileged": true }
                                }
                              ]
                            }
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject deployment = result.Should().ContainSingle().Subject;
        deployment.Properties["k8s.privileged"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_snake_case_host_network_projects_host_network_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-host-network.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "edge", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "host_network": true,
                              "containers": [
                                {
                                  "name": "edge",
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

        CanonicalObject deployment = result.Should().ContainSingle().Subject;
        deployment.Properties["k8s.hostNetwork"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_snake_case_init_containers_projects_privileged_security_context()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-init.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "api", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "init_containers": [
                                {
                                  "name": "init",
                                  "security_context": { "privileged": true }
                                }
                              ],
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

        CanonicalObject deployment = result.Should().ContainSingle().Subject;
        deployment.Properties["k8s.privileged"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_snake_case_cron_job_template_projects_host_network_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cron-host-network.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "batch/v1",
                        "kind": "CronJob",
                        "metadata": { "name": "nightly", "namespace": "prod" },
                        "spec": {
                          "job_template": {
                            "spec": {
                              "template": {
                                "spec": {
                                  "host_network": true,
                                  "containers": [
                                    {
                                      "name": "worker",
                                      "image": "busybox"
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject cronJob = result.Should().ContainSingle().Subject;
        cronJob.Properties["k8s.hostNetwork"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_snake_case_pod_security_context_projects_privileged()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster-pod-sec.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "api", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "security_context": { "privileged": true },
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

        CanonicalObject deployment = result.Should().ContainSingle().Subject;
        deployment.Properties["k8s.privileged"].Should().Be("true");
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
