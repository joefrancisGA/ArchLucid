using ArchLucid.Core.Audit;

namespace ArchLucid.Core.Governance.ComplianceDrift;

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
