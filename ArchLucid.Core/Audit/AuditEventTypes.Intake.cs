namespace ArchLucid.Core.Audit;

// Architecture request and Socratic intake draft lifecycle (see AuditEventTypes.cs for catalog rules).
public static partial class AuditEventTypes
{
    /// <summary>Architecture request draft or import persisted (namespaced <c>Request.*</c> durable type).</summary>
    public const string RequestCreated = "Request.Created";

    /// <summary>Socratic intake draft created (<c>POST /v1/architecture/draft</c>, ADR 0048).</summary>
    public const string DraftIntakeCreated = "DraftIntake.Created";

    /// <summary>Operator patched a drafting intake draft (<c>PATCH /v1/architecture/draft/{draftId}</c>).</summary>
    public const string DraftIntakePatched = "DraftIntake.Patched";

    /// <summary>Operator renamed or updated metadata on a customer architecture identity (<c>PATCH /v1/architectures/{architectureId}</c>, ADR 0074).</summary>
    public const string ArchitectureIdentityPatched = "ArchitectureIdentity.Patched";

    /// <summary>Pre-run manifest-free reasoning turn on an intake draft (SAQ-013).</summary>
    public const string DraftIntakeReasoned = "DraftIntake.Reasoned";

    /// <summary>Admitted intake draft returned to drafting so the brief can be edited again.</summary>
    public const string DraftIntakeReopened = "DraftIntake.Reopened";

    /// <summary>What-if branch draft cloned from a parent with a single override (R12).</summary>
    public const string DraftIntakeBranched = "DraftIntake.Branched";

    /// <summary>New editable draft cloned from a run-spawned snapshot (WA-10).</summary>
    public const string DraftIntakeSnapshotCloned = "DraftIntake.SnapshotCloned";

    /// <summary>Terminal intake drafts purged by the background reaper (ADR 0048).</summary>
    public const string DraftIntakeTerminalPurged = "DraftIntake.TerminalPurged";

    /// <summary>Operator answered an elicitation question on a Socratic intake draft.</summary>
    public const string DraftIntakeQuestionAnswered = "DraftIntake.QuestionAnswered";

    /// <summary>Operator explicitly skipped an elicitation question (recorded in the transparency trail).</summary>
    public const string DraftIntakeQuestionSkipped = "DraftIntake.QuestionSkipped";

    /// <summary>Admission gate evaluated an intake draft (admitted or redirected-not-refused).</summary>
    public const string DraftIntakeAdmissionEvaluated = "DraftIntake.AdmissionEvaluated";

    /// <summary>Admitted intake draft submitted to canonical architecture run create.</summary>
    public const string DraftIntakeSubmitted = "DraftIntake.Submitted";

    /// <summary>Operator exported ADR 0052 decision receipt JSON (draft redirect or committed infeasible run).</summary>
    public const string DecisionReceiptExported = "DecisionReceipt.Exported";

    /// <summary>Intake draft abandoned by operator.</summary>
    public const string DraftIntakeAbandoned = "DraftIntake.Abandoned";

    /// <summary>Request locked because a non-terminal run references it.</summary>
    public const string RequestLocked = "Request.Locked";

    /// <summary>
    ///     Bulk create accepted (<c>POST …/architecture/request/batch</c>, 202). Item persists emit durable
    ///     <see cref="RequestCreated" /> via <c>CreateRunAsync</c>.
    /// </summary>
    public const string ArchitectureRunBatchAccepted = "Architecture.RunBatchAccepted";

    /// <summary>Request released after all referencing runs reached a terminal state.</summary>
    public const string RequestReleased = "Request.Released";

    /// <summary>
    ///     Architecture request draft imported from an uploaded TOML/JSON file (
    ///     <c>POST .../architecture/request/import</c>).
    /// </summary>
    public const string RequestFileImported = "RequestFileImported";

    /// <summary>
    ///     Emitted when <c>POST /v1/architecture/import</c> CSV dry-run completes (mapped golden manifest JSON or validation
    ///     failure; no persistence).
    /// </summary>
    public const string ArchitectureDefinitionCsvImportDryRunExecuted = "ArchitectureDefinitionCsvImportDryRunExecuted";
}
