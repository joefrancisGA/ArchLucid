using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProjectScopeKeyRepositoryBoundaryTests
{
    public static IEnumerable<object[]> ProjectScopedRepositoryInterfaces()
    {
        yield return [typeof(IOperationalSecurityFindingRepository)];
        yield return [typeof(ISecurityDeclaredConnectionRepository)];
        yield return [typeof(IOperatorInferredConnectionRepository)];
        yield return [typeof(IRemediationInstanceRepository)];
    }

    [Theory]
    [MemberData(nameof(ProjectScopedRepositoryInterfaces))]
    public void SecureNow_scoped_repository_methods_require_ProjectScopeKey(Type repositoryType)
    {
        System.Reflection.MethodInfo[] scopedMethods = repositoryType
            .GetMethods()
            .Where(method =>
                method.Name.Contains("InScope", StringComparison.Ordinal)
                || method.Name.Equals("ListByScopeAsync", StringComparison.Ordinal))
            .ToArray();

        scopedMethods.Should().NotBeEmpty();

        foreach (System.Reflection.MethodInfo method in scopedMethods)
        {
            Type[] parameterTypes = method.GetParameters()
                .Select(parameter => parameter.ParameterType)
                .ToArray();

            parameterTypes.Should().Contain(
                typeof(ProjectScopeKey),
                $"{repositoryType.Name}.{method.Name} must make project authority explicit");

            method.GetParameters()
                .Select(parameter => parameter.Name)
                .Should()
                .NotContain(
                    name => name == "tenantId"
                        || name == "workspaceId"
                        || name == "projectId",
                    $"{repositoryType.Name}.{method.Name} must not reintroduce loose authority dimensions");
        }
    }
}
