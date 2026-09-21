using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditManualEvidenceRepository
{
    Task InsertSubmissionAsync(
        AuditManualEvidenceSubmissionRecord submission,
        CancellationToken cancellationToken = default);

    Task InsertSubmissionInScopeAsync(
        ProjectScopeKey scope,
        AuditManualEvidenceSubmissionMutation mutation,
        CancellationToken cancellationToken = default) =>
        InsertSubmissionAsync(mutation.ToRecord(scope.TenantId), cancellationToken);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default) =>
        ListByAssessmentAsync(scope.TenantId, assessmentId, cancellationToken);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default) =>
        ListByControlAsync(scope.TenantId, assessmentId, controlId, cancellationToken);

    Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid submissionId,
        CancellationToken cancellationToken = default);

    Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid submissionId,
        CancellationToken cancellationToken = default) =>
        TryGetByIdAsync(scope.TenantId, submissionId, cancellationToken);

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


public sealed record AuditManualEvidenceSubmissionMutation
{
    public required Guid SubmissionId { get; init; }
    public required Guid AssessmentId { get; init; }
    public required Guid ControlId { get; init; }
    public required Guid RequirementId { get; init; }
    public string? Owner { get; init; }
    public required string SubmittedBy { get; init; }
    public required DateTime SubmittedUtc { get; init; }
    public DateTime? ApplicablePeriodStartUtc { get; init; }
    public DateTime? ApplicablePeriodEndUtc { get; init; }
    public DateTime? ExpirationUtc { get; init; }
    public string? DocumentVersion { get; init; }
    public string? DocumentKind { get; init; }
    public required byte[] EvidenceHashSha256 { get; init; }
    public required string BlobPointer { get; init; }
    public required AuditEvidenceReviewStatus ReviewStatus { get; init; }
    public required ProvenanceKind ProvenanceKind { get; init; }
    public string? ItsmProvider { get; init; }
    public string? ItsmExternalKey { get; init; }

    public AuditManualEvidenceSubmissionRecord ToRecord(Guid tenantId) => new()
    {
        SubmissionId = SubmissionId,
        TenantId = tenantId,
        AssessmentId = AssessmentId,
        ControlId = ControlId,
        RequirementId = RequirementId,
        Owner = Owner,
        SubmittedBy = SubmittedBy,
        SubmittedUtc = SubmittedUtc,
        ApplicablePeriodStartUtc = ApplicablePeriodStartUtc,
        ApplicablePeriodEndUtc = ApplicablePeriodEndUtc,
        ExpirationUtc = ExpirationUtc,
        DocumentVersion = DocumentVersion,
        DocumentKind = DocumentKind,
        EvidenceHashSha256 = EvidenceHashSha256,
        BlobPointer = BlobPointer,
        ReviewStatus = ReviewStatus,
        ProvenanceKind = ProvenanceKind,
        ItsmProvider = ItsmProvider,
        ItsmExternalKey = ItsmExternalKey,
    };
}
