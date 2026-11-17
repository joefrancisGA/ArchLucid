using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAuditManualEvidenceRepository : IAuditManualEvidenceRepository
{
    public Task InsertSubmissionAsync(
        AuditManualEvidenceSubmissionRecord submission,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);

    public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);

    public Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid submissionId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AuditManualEvidenceSubmissionRecord?>(null);

    public Task InsertArchitectureLinkAsync(
        AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);

    public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);

    // Explicitly safe empty behavior for the deliberately disabled persistence provider.
    // Never delegate a scoped operation to a tenant-only implementation.
    public Task InsertSubmissionInScopeAsync(ProjectScopeKey scope, AuditManualEvidenceSubmissionMutation mutation,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);

    public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlInScopeAsync(
        ProjectScopeKey scope, Guid assessmentId, Guid controlId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);

    public Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope, Guid submissionId, CancellationToken cancellationToken = default)
        => Task.FromResult<AuditManualEvidenceSubmissionRecord?>(null);

    public Task InsertArchitectureLinkInScopeAsync(ProjectScopeKey scope, AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentInScopeAsync(
        ProjectScopeKey scope, Guid assessmentId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);

    public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlInScopeAsync(
        ProjectScopeKey scope, Guid assessmentId, Guid controlId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);
}
