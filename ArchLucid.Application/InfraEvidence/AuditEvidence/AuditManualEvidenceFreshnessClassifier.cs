using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditManualEvidenceFreshnessClassifier
{
    public static AuditEvidenceFreshnessStatus Classify(DateTime? expirationUtc, DateTime referenceUtc)
    {
        if (expirationUtc is null)
            return AuditEvidenceFreshnessStatus.Unknown;

        DateTime normalizedExpirationUtc = expirationUtc.Value.Kind == DateTimeKind.Utc
            ? expirationUtc.Value
            : expirationUtc.Value.ToUniversalTime();

        if (referenceUtc >= normalizedExpirationUtc)
            return AuditEvidenceFreshnessStatus.Expired;

        return AuditEvidenceFreshnessStatus.Current;
    }

    public static bool IsValidForCurrentAssessment(
        AuditManualEvidenceSubmissionRecord submission,
        DateTime referenceUtc)
    {
        ArgumentNullException.ThrowIfNull(submission);

        if (submission.ReviewStatus == AuditEvidenceReviewStatus.Rejected)
            return false;

        AuditEvidenceFreshnessStatus freshness = Classify(submission.ExpirationUtc, referenceUtc);

        return !AuditEvidenceFreshnessGate.BlocksCurrentAssessment(freshness);
    }
}
