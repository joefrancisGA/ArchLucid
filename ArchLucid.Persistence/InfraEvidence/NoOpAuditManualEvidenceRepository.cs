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
}
