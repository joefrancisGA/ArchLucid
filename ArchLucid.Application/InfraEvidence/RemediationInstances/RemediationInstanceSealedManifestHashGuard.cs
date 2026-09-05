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
            await operationalFindingRepository.TryGetByIdAsync(scope.TenantId, findingId, cancellationToken);

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
