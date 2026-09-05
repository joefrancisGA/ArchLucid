using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Freshness is a gate for current-assessment evaluation, not a decorative badge.</summary>
public static class AuditEvidenceFreshnessGate
{
    public static bool BlocksCurrentAssessment(AuditEvidenceFreshnessStatus status) =>
        status is AuditEvidenceFreshnessStatus.Unknown
            or AuditEvidenceFreshnessStatus.Stale
            or AuditEvidenceFreshnessStatus.Expired;

    public static bool IsRecollectRecommended(AuditEvidenceFreshnessStatus status) =>
        status is AuditEvidenceFreshnessStatus.Stale or AuditEvidenceFreshnessStatus.Expired;
}
