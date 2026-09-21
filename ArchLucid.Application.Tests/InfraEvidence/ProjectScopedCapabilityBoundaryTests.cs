using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;
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

            // CS8122: FluentAssertions NotContain compiles to an expression tree; use == instead of `is`.
            parameters.Select(parameter => parameter.Name)
                .Should()
                .NotContain(name =>
                    name == "tenantId"
                    || name == "workspaceId"
                    || name == "projectId");
        }
    }

    public static IEnumerable<object[]> MigratedProjectFacingServices()
    {
        yield return [typeof(RemediationInstanceQueryService)];
        yield return [typeof(RemediationFactoryMetricsService)];
        yield return [typeof(RemediationPatternMatcherService)];
        yield return [typeof(RemediationPrioritizationService)];
        yield return [typeof(RemediationFactoryWorkbenchQueryService)];
        yield return [typeof(RemediationWaveService)];
        yield return [typeof(AuditEvidenceSnapshotQueryService)];
        yield return [typeof(AuditEvidenceLineageService)];
        yield return [typeof(AuditManualEvidenceSubmissionService)];
        yield return [typeof(AuditEvidencePackageExportService)];
        yield return [typeof(AuditEvidenceSnapshotCollectionService)];
        yield return [typeof(SecureNowArchitectMetricsQueryService)];
        yield return [typeof(SecurityEvidencePathInspectorQueryService)];
        yield return [typeof(SecurityAssetAssertionService)];
        yield return [typeof(OperationalSecurityExceptionService)];
        yield return [typeof(RemediationInstanceService)];
        yield return [typeof(CloudResourceEvidenceHubService)];
    }

    [Theory]
    [MemberData(nameof(MigratedProjectFacingServices))]
    public void Migrated_project_facing_services_cannot_depend_on_broad_authority_repositories(Type serviceType)
    {
        Type[] parameterTypes = serviceType
            .GetConstructors()
            .Single()
            .GetParameters()
            .Select(parameter => parameter.ParameterType)
            .ToArray();

        Type[] scopedCapabilities =
        [
            typeof(IProjectScopedOperationalSecurityFindingRepository),
            typeof(IProjectScopedRemediationInstanceRepository),
            typeof(IProjectScopedAuditAssessmentRepository),
            typeof(IProjectScopedAuditEvidenceSnapshotRepository),
        ];

        parameterTypes.Should().Contain(
            parameterType => scopedCapabilities.Contains(parameterType),
            $"{serviceType.Name} must depend on at least one project-scoped repository capability");

        parameterTypes.Should().NotContain(typeof(IOperationalSecurityFindingRepository));
        parameterTypes.Should().NotContain(typeof(IRemediationInstanceRepository));
        parameterTypes.Should().NotContain(typeof(IAuditAssessmentRepository));
        parameterTypes.Should().NotContain(typeof(IAuditEvidenceSnapshotRepository));
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
