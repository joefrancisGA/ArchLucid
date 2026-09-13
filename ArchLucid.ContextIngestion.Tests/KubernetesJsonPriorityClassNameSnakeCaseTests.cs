using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class KubernetesJsonPriorityClassNameSnakeCaseTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_priority_class_name_projects_priority_class_name_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "priority-class.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "worker", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "priority_class_name": "high-priority",
                              "containers": [
                                {
                                  "name": "app",
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
        deployment.Properties["k8s.priorityclassname"].Should().Be("high-priority");
    }
}
