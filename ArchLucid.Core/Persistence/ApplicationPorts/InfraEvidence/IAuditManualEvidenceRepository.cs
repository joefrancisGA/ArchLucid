namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditManualEvidenceRepository
{
    Task InsertSubmissionAsync(
        AuditManualEvidenceSubmissionRecord submission,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default);

    Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid submissionId,
        CancellationToken cancellationToken = default);

    Task InsertArchitectureLinkAsync(
        AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default);
}
