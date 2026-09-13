using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class KubernetesJsonCronJobPodTemplateSnakeCaseTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_cron_job_pod_template_projects_host_network_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cron-pod-template.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "batch/v1",
                        "kind": "CronJob",
                        "metadata": { "name": "nightly", "namespace": "prod" },
                        "spec": {
                          "job_template": {
                            "spec": {
                              "pod_template": {
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
}
