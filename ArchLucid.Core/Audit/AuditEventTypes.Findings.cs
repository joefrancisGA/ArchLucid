namespace ArchLucid.Core.Audit;

// Findings snapshots, human review dispositions, waivers, recurrence schedules, and evidence curation.
public static partial class AuditEventTypes
{
    /// <summary>Bulk findings list read (<c>GET /v1/runs/{runId}/findings</c>).</summary>
    public const string FindingsListAccessed = "FindingsListAccessed";

    /// <summary>Findings-derived clarification questions read (<c>GET /v1/architecture/review/{runId}/clarification-questions</c>).</summary>
    public const string ReviewClarificationQuestionsAccessed = "ReviewClarificationQuestionsAccessed";

    /// <summary>Operator applied clarification answers onto knowledge model unresolved questions (<c>POST /v1/architecture/review/{runId}/knowledge-model/clarification-answers</c>).</summary>
    public const string KnowledgeModelClarificationAnswersApplied = "KnowledgeModelClarificationAnswersApplied";

    /// <summary>Operator resolved a finding merge conflict on a committed run (<c>POST /v1/governance/runs/{runId}/finding-merge-conflicts/{findingId}/resolve</c>).</summary>
    public const string FindingMergeConflictResolved = "FindingMergeConflictResolved";

    /// <summary>Findings snapshot generation reached a sealed terminal generation status.</summary>
    public const string FindingsSnapshotSealed = "FindingsSnapshotSealed";

    /// <summary>Human reviewer approved a finding.</summary>
    public const string FindingReviewApproved = "FindingReviewApproved";

    /// <summary>Human reviewer rejected a finding.</summary>
    public const string FindingReviewRejected = "FindingReviewRejected";

    /// <summary>Privileged override applied after rejection.</summary>
    public const string FindingReviewOverridden = "FindingReviewOverridden";

    /// <summary>Operator recorded a TB-058 finding disposition.</summary>
    public const string FindingReviewDispositionRecorded = "FindingReviewDispositionRecorded";

    /// <summary>Operator explicitly marked a finding as Remediated.</summary>
    public const string FindingRemediated = "FindingRemediated";

    /// <summary>Operator created a TB-059 risk exception (waiver).</summary>
    public const string RiskExceptionCreated = "RiskExceptionCreated";

    /// <summary>Operator revoked a TB-059 risk exception (waiver).</summary>
    public const string RiskExceptionRevoked = "RiskExceptionRevoked";

    /// <summary>Operator renewed a TB-059 risk exception (waiver) with a new expiration.</summary>
    public const string RiskExceptionRenewed = "RiskExceptionRenewed";

    /// <summary>System expired a TB-059 risk exception when listing active waivers past <c>ExpiresAtUtc</c>.</summary>
    public const string RiskExceptionExpired = "RiskExceptionExpired";

    /// <summary>TB-2193 scanner sent an escalating expiry reminder for a risk exception at a cadence boundary.</summary>
    public const string RiskExceptionExpiryReminderSent = "RiskExceptionExpiryReminderSent";

    /// <summary>Operator created a TB-062 architecture review recurrence schedule.</summary>
    public const string ArchitectureReviewRecurrenceScheduleCreated = "ArchitectureReviewRecurrenceScheduleCreated";

    public const string ArchitectureReviewRecurrenceScheduleUpdated = "ArchitectureReviewRecurrenceScheduleUpdated";

    /// <summary>Recurring architecture review schedule fired and started a follow-up run (TB-059–062).</summary>
    public const string ArchitectureReviewRecurrenceTriggered = "ArchitectureReviewRecurrenceTriggered";

    /// <summary>Recurrence completion email + delta notification dispatched (TB-261).</summary>
    public const string ArchitectureReviewRecurrenceNotified = "ArchitectureReviewRecurrenceNotified";

    /// <summary>Recurrence schedule auto-disabled after repeated failures (TB-262).</summary>
    public const string ArchitectureReviewRecurrenceAutoDisabled = "ArchitectureReviewRecurrenceAutoDisabled";

    /// <summary>Operator muted a finding for the active review (durable <c>dbo.FindingRecords</c> row).</summary>
    public const string FindingMuted = "FindingMuted";

    /// <summary>Operator updated general remediation assignee/due date on a finding row (TB-395).</summary>
    public const string FindingRemediationAssignmentUpdated = "FindingRemediationAssignmentUpdated";

    /// <summary>Bulk evidence files were attached to a run.</summary>
    public const string EvidenceBulkAttached = "EvidenceBulkAttached";

    /// <summary>
    ///     Admin promoted an agent-curated evidence proposal into the tenant catalog (
    ///     <c>POST /v1/admin/evidence/proposals/{{resultId}}/promote</c>).
    /// </summary>
    public const string EvidenceProposalPromoted = "EvidenceProposalPromoted";
}
