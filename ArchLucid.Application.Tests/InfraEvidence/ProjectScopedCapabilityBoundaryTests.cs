using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Architecture")]
[Trait("Suite", "Application")]
public sealed class ProjectScopedCapabilityBoundaryTests
{
    public static IEnumerable<object[]> CapabilityInterfaces()
    {
        yield return [typeof(IProjectScopedOperationalSecurityFindingRepository)];
        yield return [typeof(IProjectScopedRemediationInstanceRepository)];
        yield return [typeof(IProjectScopedAuditAssessmentRepository)];
        yield return [typeof(IProjectScopedAuditEvidenceSnapshotRepository)];
    }

    [Theory]
    [MemberData(nameof(CapabilityInterfaces))]
    public void Project_scoped_capabilities_require_ProjectScopeKey_and_expose_no_loose_authority(Type capabilityType)
    {
        System.Reflection.MethodInfo[] methods = capabilityType.GetMethods();
        methods.Should().NotBeEmpty();

        foreach (System.Reflection.MethodInfo method in methods)
        {
            System.Reflection.ParameterInfo[] parameters = method.GetParameters();

            parameters.Select(parameter => parameter.ParameterType)
                .Should()
                .Contain(typeof(ProjectScopeKey), $"{capabilityType.Name}.{method.Name} must require explicit project authority");

            parameters.Select(parameter => parameter.Name)
                .Should()
                .NotContain(name => name is "tenantId" or "workspaceId" or "projectId");
        }
    }

    [Fact]
    public void Remediation_instance_query_service_depends_only_on_scoped_finding_and_instance_capabilities()
    {
        Type[] parameterTypes = typeof(RemediationInstanceQueryService)
            .GetConstructors()
            .Single()
            .GetParameters()
            .Select(parameter => parameter.ParameterType)
            .ToArray();

        parameterTypes.Should().Contain(typeof(IProjectScopedRemediationInstanceRepository));
        parameterTypes.Should().Contain(typeof(IProjectScopedOperationalSecurityFindingRepository));
        parameterTypes.Should().NotContain(typeof(IRemediationInstanceRepository));
        parameterTypes.Should().NotContain(typeof(IOperationalSecurityFindingRepository));
    }

    [Fact]
    public void Audit_snapshot_query_service_depends_only_on_scoped_assessment_and_snapshot_capabilities()
    {
        Type[] parameterTypes = typeof(AuditEvidenceSnapshotQueryService)
            .GetConstructors()
            .Single()
            .GetParameters()
            .Select(parameter => parameter.ParameterType)
            .ToArray();

        parameterTypes.Should().Contain(typeof(IProjectScopedAuditAssessmentRepository));
        parameterTypes.Should().Contain(typeof(IProjectScopedAuditEvidenceSnapshotRepository));
        parameterTypes.Should().NotContain(typeof(IAuditAssessmentRepository));
        parameterTypes.Should().NotContain(typeof(IAuditEvidenceSnapshotRepository));
    }
}
