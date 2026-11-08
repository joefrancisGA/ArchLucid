using ArchLucid.Core.InfraEvidence;
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
        throw new NotSupportedException("Project-scoped audit evidence writes require an explicit scoped repository implementation.");

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("Project-scoped audit evidence reads require an explicit scoped repository implementation.");

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
        throw new NotSupportedException("Project-scoped audit evidence reads require an explicit scoped repository implementation.");

    Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid submissionId,
        CancellationToken cancellationToken = default);

    Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid submissionId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("Project-scoped audit evidence reads require an explicit scoped repository implementation.");

    Task InsertArchitectureLinkAsync(
        AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default);

    Task InsertArchitectureLinkInScopeAsync(
        ProjectScopeKey scope,
        AuditArchitectureEvidenceLinkRecord link,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("Project-scoped audit evidence writes require an explicit scoped repository implementation.");

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentIdsAsync(
        Guid tenantId,
        IReadOnlyList<Guid> assessmentIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(assessmentIds);

        List<AuditArchitectureEvidenceLinkRecord> results = [];

        foreach (Guid assessmentId in assessmentIds.Where(id => id != Guid.Empty).Distinct())
        {
            IReadOnlyList<AuditArchitectureEvidenceLinkRecord> links =
                await ListArchitectureLinksByAssessmentAsync(tenantId, assessmentId, cancellationToken);

            results.AddRange(links);
        }

        return results;
    }

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("Project-scoped audit evidence reads require an explicit scoped repository implementation.");

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("Project-scoped audit evidence reads require an explicit scoped repository implementation.");
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
        Owner = EmptyIfNull(Owner),
        SubmittedBy = SubmittedBy,
        SubmittedUtc = SubmittedUtc,
        ApplicablePeriodStartUtc = ApplicablePeriodStartUtc,
        ApplicablePeriodEndUtc = ApplicablePeriodEndUtc,
        ExpirationUtc = ExpirationUtc,
        DocumentVersion = DocumentVersion,
        DocumentKind = EmptyIfNull(DocumentKind),
        EvidenceHashSha256 = EvidenceHashSha256,
        BlobPointer = BlobPointer,
        ReviewStatus = ReviewStatus,
        ProvenanceKind = ProvenanceKind,
        ItsmProvider = ItsmProvider,
        ItsmExternalKey = ItsmExternalKey,
    };

    // Persistence records keep Owner/DocumentKind non-null (empty when omitted).
    private static string EmptyIfNull(string? value) => value ?? string.Empty;
}
