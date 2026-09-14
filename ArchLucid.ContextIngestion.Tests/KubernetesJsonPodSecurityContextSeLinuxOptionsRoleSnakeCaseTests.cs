
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class KubernetesJsonPodSecurityContextSeLinuxOptionsRoleSnakeCaseTests
{
    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_snake_case_pod_security_context_se_linux_options_role_projects_se_linux_role_exposure()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "pod-security-context-se-linux-role.json",
            Format = "kubernetes-json",
            Content = """
                      {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": { "name": "worker", "namespace": "prod" },
                        "spec": {
                          "template": {
                            "spec": {
                              "security_context": {
                                "se_linux_options": { "role": "system_r:system_r:init_t" }
                              },
                              "containers": [ { "name": "app", "image": "nginx" } ]
                            }
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        CanonicalObject deployment = result.Should().ContainSingle().Subject;
        deployment.Properties["k8s.selinuxrole"].Should().Be("system_r:system_r:init_t");
    }
}
