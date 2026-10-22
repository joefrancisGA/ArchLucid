using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class KubernetesJsonSecurityContextRunAsGroupSnakeCaseTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_security_context_run_as_group_projects_runasgroup_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "security-context-run_as_group.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "worker", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "containers": [
                                {
                                  "name": "app",
                                  "image": "nginx",
                                  "security_context": { "run_as_group": 2000 }
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
        deployment.Properties["k8s.runasgroup"].Should().Be("2000");
    }
}
