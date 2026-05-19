using ArchLucid.Core.Audit;

namespace ArchLucid.Decisioning.Governance.ComplianceDrift;

/// <summary>Audit event types mapped to compliance-drift findings trend buckets (no findings schema changes).</summary>
public static class ComplianceDriftFindingsTrendAuditTypes
{
    public static readonly string[] Opened =
    [
        AuditEventTypes.FindingsSnapshotSealed,
    ];

    public static readonly string[] Resolved =
    [
        AuditEventTypes.FindingReviewApproved,
        AuditEventTypes.FindingReviewRejected,
        AuditEventTypes.FindingReviewOverridden,
    ];
}
