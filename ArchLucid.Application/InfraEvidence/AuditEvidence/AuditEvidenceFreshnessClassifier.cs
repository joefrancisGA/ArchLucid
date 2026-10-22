using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditEvidenceFreshnessClassifier
{
    public static AuditEvidenceFreshnessStatus Classify(
        DateTime? collectedUtc,
        DateTime referenceUtc,
        AuditEvidenceFreshnessPolicy policy)
    {
        ArgumentNullException.ThrowIfNull(policy);

        if (collectedUtc is null)
            return AuditEvidenceFreshnessStatus.Unknown;

        DateTime normalizedCollectedUtc = collectedUtc.Value.Kind == DateTimeKind.Utc
            ? collectedUtc.Value
            : collectedUtc.Value.ToUniversalTime();

        double ageDays = (referenceUtc - normalizedCollectedUtc).TotalDays;

        if (ageDays < 0)
            ageDays = 0;

        if (!policy.IsParseable)
            return AuditEvidenceFreshnessStatus.Unknown;

        if (ageDays <= 1)
            return AuditEvidenceFreshnessStatus.Current;

        if (ageDays <= policy.FreshDays * 0.75)
            return AuditEvidenceFreshnessStatus.Fresh;

        if (ageDays <= policy.StaleDays)
            return AuditEvidenceFreshnessStatus.Aging;

        if (ageDays <= policy.ExpireDays)
            return AuditEvidenceFreshnessStatus.Stale;

        return AuditEvidenceFreshnessStatus.Expired;
    }
}
