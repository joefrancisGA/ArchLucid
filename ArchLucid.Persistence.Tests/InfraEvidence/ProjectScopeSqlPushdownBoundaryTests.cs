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
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "UpdateInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListByScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "ListByScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "UpdateRenewalInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "RevokeInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "MarkExpiredInScopeAsync"];
        yield return [typeof(ISecurityDeclaredConnectionRepository), typeof(SqlSecurityDeclaredConnectionRepository), "MarkExpiryProcessedInScopeAsync"];
        yield return [typeof(IOperatorInferredConnectionRepository), typeof(SqlOperatorInferredConnectionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IOperatorInferredConnectionRepository), typeof(SqlOperatorInferredConnectionRepository), "UpdateStatusInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "UpdateInstanceInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "ListByScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "MarkExpiredInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "MarkExpiryProcessedInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "RevokeInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "UpdateRenewalInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "TryGetActiveByCloudResourceIdInScopeAsync"];
        yield return [typeof(ISecurityAssetAssertionRepository), typeof(SqlSecurityAssetAssertionRepository), "ListActiveAssertionIdsInScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "ListByScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "MarkExpiredInScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "MarkExpiryProcessedInScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "RevokeInScopeAsync"];
        yield return [typeof(IOperationalSecurityExceptionRepository), typeof(SqlOperationalSecurityExceptionRepository), "HasActiveExceptionForFindingInScopeAsync"];
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

    public static IEnumerable<object[]> ProjectScopedMutationCommands()
    {
        yield return [typeof(OperatorInferredConnectionMutation)];
        yield return [typeof(RemediationInstanceMutation)];
        yield return [typeof(SecurityDeclaredConnectionRevokeMutation)];
        yield return [typeof(SecurityDeclaredConnectionRenewalMutation)];
        yield return [typeof(SecurityDeclaredConnectionExpiryProcessedMutation)];
        yield return [typeof(OperationalSecurityFindingMutation)];
        yield return [typeof(OperationalSecurityFindingMetadataMutation)];
        yield return [typeof(OperationalSecurityFindingObservationMutation)];
        yield return [typeof(SecurityAssetAssertionRevokeMutation)];
        yield return [typeof(SecurityAssetAssertionRenewalMutation)];
        yield return [typeof(SecurityAssetAssertionExpiryProcessedMutation)];
        yield return [typeof(OperationalSecurityExceptionRevokeMutation)];
        yield return [typeof(OperationalSecurityExceptionExpiryProcessedMutation)];
    }

    [Theory]
    [MemberData(nameof(ProjectScopedMutationCommands))]
    public void Project_scoped_mutation_commands_do_not_carry_authority_dimensions(Type mutationType)
    {
        string[] propertyNames = mutationType
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();

        propertyNames.Should().NotContain("TenantId");
        propertyNames.Should().NotContain("WorkspaceId");
        propertyNames.Should().NotContain("ProjectId");
        propertyNames.Should().NotContain("Scope");
        propertyNames.Should().NotContain("ProjectScopeKey");
    }
}
