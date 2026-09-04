namespace ArchLucid.Core.Audit;

// Policy packs, approval workflows, pre-commit gates, and the trusted-baseline log channel.
public static partial class AuditEventTypes
{
    /// <summary>Governance approval request created (<c>POST /v1/governance/approval-requests</c>).</summary>
    public const string GovernanceApprovalRequested = "GovernanceApprovalRequested";

    /// <summary>
    ///     Slack Block Kit approve/reject interactivity dispatched after signature verification (
    ///     <c>POST …/integrations/webhooks/slack/interactivity</c>); workflow outcome audits emit per approval request.
    /// </summary>
    public const string GovernanceSlackInteractivityDispatched = "GovernanceSlackInteractivityDispatched";

    public const string PolicyPackCreated = "PolicyPackCreated";
    public const string PolicyPackVersionPublished = "PolicyPackVersionPublished";
    public const string PolicyPackAssigned = "PolicyPackAssigned";
    public const string PolicyPackAssignmentCreated = "PolicyPackAssignmentCreated";
    public const string PolicyPackAssignmentArchived = "PolicyPackAssignmentArchived";

    public const string PolicyPackDuplicated = "PolicyPackDuplicated";

    /// <summary>Admin promoted a policy pack snapshot into the global catalog.</summary>
    public const string PolicyPackCatalogPromoted = "PolicyPackCatalogPromoted";

    /// <summary>Admin demoted a catalog entry from the buyer-visible catalog.</summary>
    public const string PolicyPackCatalogDemoted = "PolicyPackCatalogDemoted";

    /// <summary>Tenant admin enabled or disabled a policy pack assignment for the workspace.</summary>
    public const string PolicyPackAssignmentEnabledChanged = "PolicyPackAssignmentEnabledChanged";

    /// <summary>Tenant admin marked a policy pack assignment as organization-required (or removed that lock).</summary>
    public const string PolicyPackAssignmentOrganizationRequiredChanged = "PolicyPackAssignmentOrganizationRequiredChanged";

    /// <summary>Platform admin globally activated or deactivated a bundled policy pack.</summary>
    public const string PlatformBundledPolicyPackActivationChanged = "PlatformBundledPolicyPackActivationChanged";

    public const string GovernanceResolutionExecuted = "GovernanceResolutionExecuted";
    public const string GovernanceConflictDetected = "GovernanceConflictDetected";

    public const string GovernanceApprovalSubmitted = "GovernanceApprovalSubmitted";
    public const string GovernanceApprovalApproved = "GovernanceApprovalApproved";

    public const string GovernanceApprovalRejected = "GovernanceApprovalRejected";

    /// <summary>Administrator replaced the governance environment catalog for the current scope.</summary>
    public const string GovernanceEnvironmentCatalogReplaced = "GovernanceEnvironmentCatalogReplaced";

    /// <summary>
    ///     Durable audit when a reviewer is blocked from approving or rejecting their own governance request (segregation
    ///     of duties).
    /// </summary>
    public const string GovernanceSelfApprovalBlocked = "GovernanceSelfApprovalBlocked";

    /// <summary>Emitted when optional pre-commit governance blocks manifest commit due to critical findings.</summary>
    public const string GovernancePreCommitBlocked = "GovernancePreCommitBlocked";

    /// <summary>Emitted when pre-commit governance enforcement is overridden via commit-body break-glass justification.</summary>
    public const string GovernanceBypassInvoked = "GovernanceBypassInvoked";

    /// <summary>Emitted when pre-commit governance warns but allows commit due to WarnOnly severity configuration.</summary>
    public const string GovernancePreCommitWarned = "GovernancePreCommitWarned";

    /// <summary>
    ///     Operator ran pre-commit gate what-if with synthetic findings (
    ///     <c>POST /v1/governance/pre-finalize/simulate</c>). Payload summarizes request parameters and gate outcome; no
    ///     manifest commit.
    /// </summary>
    public const string GovernancePreCommitSimulationEvaluated = "GovernancePreCommitSimulationEvaluated";

    /// <summary>Emitted when a governance approval request breaches its SLA deadline.</summary>
    public const string GovernanceApprovalSlaBreached = "GovernanceApprovalSlaBreached";

    public const string GovernanceManifestPromoted = "GovernanceManifestPromoted";
    public const string GovernanceEnvironmentActivated = "GovernanceEnvironmentActivated";

    /// <summary>
    ///     Operator recorded a correction for a prior governance mutation without mutating the original row (
    ///     <c>POST /v1/governance/mutation-corrections</c>).
    /// </summary>
    public const string GovernanceMutationCorrectionRecorded = "GovernanceMutationCorrectionRecorded";

    /// <summary>
    ///     Emitted when an operator runs a governance policy-pack dry-run / what-if evaluation
    ///     (<c>POST /v1/governance/policy-packs/{id}/dry-run</c>). No real commit happens — the
    ///     payload captures the proposed thresholds (always passed through the LLM-prompt redaction
    ///     pipeline before serialisation, per PENDING_QUESTIONS Q37), the evaluated run ids, and
    ///     would-be delta counts so reviewers can audit what was simulated and by whom.
    /// </summary>
    public const string GovernanceDryRunRequested = "GovernanceDryRunRequested";

    /// <summary>
    ///     Durable audit when an operator validates a governance write path with <c>dryRun=true</c> (
    ///     approval request or promotion): same validation as a real commit runs, but no row/outbox/ integration
    ///     publish. Payload names the workflow (approval vs promotion) and the non-sensitive request fields so SIEM
    ///     can detect probing without relying on skipped <see cref="GovernanceApprovalSubmitted" /> rows.
    /// </summary>
    public const string GovernanceDryRunValidationAttempted = "GovernanceDryRunValidationAttempted";

    /// <summary>Operator recorded run-level approve / reject / request-remediation on <c>dbo.Runs</c> (TB-112).</summary>
    public const string RunOperatorGovernanceDispositionRecorded = "RunOperatorGovernanceDispositionRecorded";

    /// <summary>
    ///     Durable audit when a review run's effective governance scope is resolved and persisted at execute time (
    ///     <c>dbo.Runs.GovernanceScopeJson</c>).
    /// </summary>
    public const string RunGovernanceScopeResolved = "RunGovernanceScopeResolved";

    /// <summary>
    ///     Stable namespaced strings for trusted-baseline mutation audit (<c>IBaselineMutationAuditService</c> → structured
    ///     <c>ILogger</c> only).
    ///     They are <b>not</b> written to <c>dbo.AuditEvents</c>.
    /// </summary>
    /// <remarks>
    ///     <para>
    ///         Dual-written governance flows also call <c>IAuditService</c> with the top-level <c>GovernanceApproval*</c> /
    ///         <c>GovernanceManifestPromoted</c> / <c>GovernanceEnvironmentActivated</c> constants above.
    ///         Those durable <c>EventType</c> values (e.g. <c>GovernanceApprovalSubmitted</c>) differ from nested
    ///         <c>Governance.*</c> string values (e.g. <c>Governance.ApprovalRequestSubmitted</c>) by design — do not unify
    ///         without a migration plan for existing rows and log parsers.
    ///     </para>
    /// </remarks>
    public static class Baseline
    {
        /// <summary>Architecture run / string <c>RunId</c> workflow (authority <c>dbo.Runs</c>).</summary>
        public static class Architecture
        {
            public const string RunCreated = "Architecture.RunCreated";

            public const string RunStarted = "Architecture.RunStarted";

            public const string RunExecuteSucceeded = "Architecture.RunExecuteSucceeded";

            public const string RunCompleted = "Architecture.RunCompleted";

            public const string RunFailed = "Architecture.RunFailed";

            public const string RunQualityGateRejected = "Architecture.RunQualityGateRejected";
        }

        /// <summary>Governance workflow mutations when integrated with the trusted baseline (baseline log channel).</summary>
        public static class Governance
        {
            public const string ApprovalRequestSubmitted = "Governance.ApprovalRequestSubmitted";

            public const string ApprovalRequestApproved = "Governance.ApprovalRequestApproved";

            public const string ApprovalRequestRejected = "Governance.ApprovalRequestRejected";

            public const string ManifestPromoted = "Governance.ManifestPromoted";

            public const string EnvironmentActivated = "Governance.EnvironmentActivated";
        }
    }
}
