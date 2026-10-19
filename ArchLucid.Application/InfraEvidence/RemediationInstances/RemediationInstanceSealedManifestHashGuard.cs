using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

/// <summary>Wave-31 suggestions 356–359: remediation-instance mutations fail-closed when finding links to a run with sealed manifest.</summary>
public static class RemediationInstanceSealedManifestHashGuard
{
    public static async Task EnsureFindingLinkedRunSealedManifestHashOrThrowAsync(
        Guid findingId,
        ScopeContext scope,
        IProjectScopedOperationalSecurityFindingRepository operationalFindingRepository,
        IAuditManualEvidenceRepository auditManualEvidenceRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (findingId == Guid.Empty)
            return;

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(operationalFindingRepository);
        ArgumentNullException.ThrowIfNull(auditManualEvidenceRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        OperationalSecurityFindingRecord? finding =
            await operationalFindingRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), findingId, cancellationToken);

        if (finding?.AssessmentId is null || finding.AssessmentId == Guid.Empty)
            return;

        IReadOnlyList<AuditArchitectureEvidenceLinkRecord> links =
            await auditManualEvidenceRepository.ListArchitectureLinksByAssessmentAsync(
                scope.TenantId,
                finding.AssessmentId.Value,
                cancellationToken);

        Guid runId = links
            .Select(link => link.RunId)
            .FirstOrDefault(candidate => candidate != Guid.Empty);

        if (runId == Guid.Empty)
            return;

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }

    public static async Task EnsureDistinctFindingLinkedRunsSealedManifestHashOrThrowAsync(
        IReadOnlyList<Guid> findingIds,
        ScopeContext scope,
        IProjectScopedOperationalSecurityFindingRepository operationalFindingRepository,
        IAuditManualEvidenceRepository auditManualEvidenceRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(findingIds);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(operationalFindingRepository);
        ArgumentNullException.ThrowIfNull(auditManualEvidenceRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        List<Guid> distinctFindingIds = findingIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctFindingIds.Count == 0)
            return;

        IReadOnlyList<OperationalSecurityFindingRecord> findings =
            await operationalFindingRepository.ListByIdsInScopeAsync(
                scope.ToProjectScopeKey(),
                distinctFindingIds,
                cancellationToken);

        List<Guid> assessmentIds = findings
            .Where(finding => finding.AssessmentId is Guid assessmentId && assessmentId != Guid.Empty)
            .Select(finding => finding.AssessmentId!.Value)
            .Distinct()
            .ToList();

        if (assessmentIds.Count == 0)
            return;

        IReadOnlyList<AuditArchitectureEvidenceLinkRecord> links =
            await auditManualEvidenceRepository.ListArchitectureLinksByAssessmentIdsAsync(
                scope.TenantId,
                assessmentIds,
                cancellationToken);

        Dictionary<Guid, Guid> assessmentRunIds = [];

        foreach (AuditArchitectureEvidenceLinkRecord link in links)
        {
            if (link.RunId == Guid.Empty)
                continue;

            if (!assessmentRunIds.ContainsKey(link.AssessmentId))
                assessmentRunIds[link.AssessmentId] = link.RunId;
        }

        HashSet<Guid> distinctRunIds = assessmentRunIds.Values.ToHashSet();

        await GovernanceDispositionSealedManifestGuard.EnsureDistinctRunsSealedManifestHashOrThrowAsync(
            distinctRunIds.ToList(),
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }

    public static async Task EnsureFindingLinkedRunSealedManifestHashOrThrowAsync(
        Guid findingId,
        ScopeContext scope,
        IOperationalSecurityFindingRepository operationalFindingRepository,
        IAuditManualEvidenceRepository auditManualEvidenceRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (findingId == Guid.Empty)
            return;

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(operationalFindingRepository);
        ArgumentNullException.ThrowIfNull(auditManualEvidenceRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        OperationalSecurityFindingRecord? finding =
            await operationalFindingRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), findingId, cancellationToken);

        if (finding?.AssessmentId is null || finding.AssessmentId == Guid.Empty)
            return;

        IReadOnlyList<AuditArchitectureEvidenceLinkRecord> links =
            await auditManualEvidenceRepository.ListArchitectureLinksByAssessmentAsync(
                scope.TenantId,
                finding.AssessmentId.Value,
                cancellationToken);

        Guid runId = links
            .Select(link => link.RunId)
            .FirstOrDefault(candidate => candidate != Guid.Empty);

        if (runId == Guid.Empty)
            return;

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
