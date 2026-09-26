using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
[Trait("Category", "Architecture")]
public sealed class ProjectScopeSqlPushdownBoundaryTests
{
    public static IEnumerable<object[]> ScopedSqlMethods()
    {
        yield return [typeof(ISecurityEvidencePathRankRepository), typeof(SqlSecurityEvidencePathRankRepository), "ListBySnapshotAsync"];
        yield return [typeof(ISecurityEvidenceCutPointRepository), typeof(SqlSecurityEvidenceCutPointRepository), "ListBySnapshotAsync"];
        yield return [typeof(ISecurityEvidencePathRepository), typeof(SqlSecurityEvidencePathRepository), "ListBySnapshotAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "TryGetByNaturalKeyInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "UpdateInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListByScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListMetadataByFindingInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListByCloudResourceIdPagedInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListFindingIdsByPathIdInScopeAsync"];
        yield return [typeof(IOperationalSecurityFindingRepository), typeof(SqlOperationalSecurityFindingRepository), "ListObservationsByFindingInScopeAsync"];
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
        yield return [typeof(ISecurityEvidencePathRepository), typeof(SqlSecurityEvidencePathRepository), "ListHopsByPathInScopeAsync"];
        yield return [typeof(ISecurityEvidencePathRepository), typeof(SqlSecurityEvidencePathRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(ISecurityEvidencePathRankRepository), typeof(SqlSecurityEvidencePathRankRepository), "TryGetRankInScopeAsync"];
        yield return [typeof(ISecurityEvidencePathRankRepository), typeof(SqlSecurityEvidencePathRankRepository), "ReplaceRanksForSnapshotInScopeAsync"];
        yield return [typeof(ISecurityEvidenceCutPointRepository), typeof(SqlSecurityEvidenceCutPointRepository), "ListByPathIdInScopeAsync"];
        yield return [typeof(ISecurityEvidenceCutPointRepository), typeof(SqlSecurityEvidenceCutPointRepository), "ReplaceCutPointsForSnapshotInScopeAsync"];
        yield return [typeof(ISecurityEvidencePathRoutingRepository), typeof(SqlSecurityEvidencePathRoutingRepository), "ListByPathIdInScopeAsync"];
        yield return [typeof(ISecurityEvidencePathRoutingRepository), typeof(SqlSecurityEvidencePathRoutingRepository), "ReplaceRoutingForPathInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "ListByScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "ListEvidenceByInstanceInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "ListByCloudResourceIdPagedInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "ListByFindingIdInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "InsertInstanceInScopeAsync"];
        yield return [typeof(IRemediationInstanceRepository), typeof(SqlRemediationInstanceRepository), "InsertEvidenceInScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "InsertWaveInScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "UpdateWaveInScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "ListByScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "InsertMemberInScopeAsync"];
        yield return [typeof(IRemediationWaveRepository), typeof(SqlRemediationWaveRepository), "ListMembersByWaveInScopeAsync"];
        yield return [typeof(IRemediationPrioritizationRepository), typeof(SqlRemediationPrioritizationRepository), "ListScoresByScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "DeactivateMatchesForFindingInScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "InsertMatchResultInScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "InsertConflictInScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "TryGetActiveMatchInScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "ListByFindingInScopeAsync"];
        yield return [typeof(IRemediationPatternMatchRepository), typeof(SqlRemediationPatternMatchRepository), "ListConflictsByFindingInScopeAsync"];
        yield return [typeof(IRemediationPrioritizationRepository), typeof(SqlRemediationPrioritizationRepository), "UpsertScoreInScopeAsync"];
        yield return [typeof(IAuditAssessmentRepository), typeof(SqlAuditAssessmentRepository), "InsertInScopeAsync"];
        yield return [typeof(IAuditAssessmentRepository), typeof(SqlAuditAssessmentRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IAuditAssessmentRepository), typeof(SqlAuditAssessmentRepository), "UpdateStatusInScopeAsync"];
        yield return [typeof(IAuditAssessmentRepository), typeof(SqlAuditAssessmentRepository), "ListActiveByScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "InsertSubmissionInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "ListByAssessmentInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "ListByControlInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "TryGetByIdInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "InsertSnapshotInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "TryGetHeaderInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "ListItemsInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "ListByAssessmentInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "TryGetBaselineByNameInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "UpdateItemFreshnessInScopeAsync"];
        yield return [typeof(IAuditEvidenceSnapshotRepository), typeof(SqlAuditEvidenceSnapshotRepository), "InsertBaselineInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "InsertArchitectureLinkInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "ListArchitectureLinksByAssessmentInScopeAsync"];
        yield return [typeof(IAuditManualEvidenceRepository), typeof(SqlAuditManualEvidenceRepository), "ListArchitectureLinksByControlInScopeAsync"];
        yield return [typeof(IAuditControlEvaluationRepository), typeof(SqlAuditControlEvaluationRepository), "InsertInScopeAsync"];
        yield return [typeof(IAuditControlEvaluationRepository), typeof(SqlAuditControlEvaluationRepository), "TryGetLatestByControlInScopeAsync"];
        yield return [typeof(IAuditControlEvaluationRepository), typeof(SqlAuditControlEvaluationRepository), "ListEvidenceItemsByEvaluationInScopeAsync"];
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
        yield return [typeof(RemediationPrioritizationScoreMutation)];
        yield return [typeof(RemediationWaveCreateMutation)];
        yield return [typeof(RemediationWaveMutation)];
        yield return [typeof(RemediationWaveMemberMutation)];
        yield return [typeof(AuditAssessmentCreateMutation)];
        yield return [typeof(AuditAssessmentStatusMutation)];
        yield return [typeof(AuditManualEvidenceSubmissionMutation)];
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
