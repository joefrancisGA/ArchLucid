using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
[Trait("Category", "Architecture")]
public sealed class ProjectScopeSqlPushdownBoundaryTests
{
    public static IEnumerable<object[]> ScopedSqlMethods()
    {
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "TryGetByNaturalKeyInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "ListByScopeAsync"];
        yield return [typeof(IOperatorInferredConnectionRepository), typeof(SqlOperatorInferredConnectionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "TryGetByIdInScopeAsync"];
    }

    [Theory]
    [MemberData(nameof(ScopedSqlMethods))]
    public void Production_sql_adapter_must_override_scoped_interface_method(
        Type repositoryInterface,
        Type implementationType,
        string methodName)
    {
        System.Reflection.MethodInfo interfaceMethod = repositoryInterface
            .GetMethods()
            .Single(method => method.Name == methodName);

        System.Reflection.InterfaceMapping map = implementationType.GetInterfaceMap(repositoryInterface);
        int index = Array.IndexOf(map.InterfaceMethods, interfaceMethod);

        index.Should().BeGreaterThanOrEqualTo(0);
        map.TargetMethods[index].DeclaringType.Should().Be(
            implementationType,
            $"{implementationType.Name}.{methodName} must push ProjectScopeKey into its persistence query instead of inheriting the interface fallback");
    }
}
