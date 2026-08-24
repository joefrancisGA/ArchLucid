namespace ArchLucid.Application.Drafts;

using ArchLucid.Contracts.Drafts;

/// <summary>Validates draft lifecycle transitions (ADR 0048).</summary>
public static class DraftRequestStateMachine
{
    /// <summary>Returns <see langword="true" /> when <paramref name="status" /> allows content patches.</summary>
    public static bool IsMutable(DraftRequestStatus status) => status == DraftRequestStatus.Drafting;

    /// <summary>Returns <see langword="true" /> when question answers may be recorded.</summary>
    public static bool AllowsQuestionAnswers(DraftRequestStatus status) =>
        status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

    /// <summary>Returns <see langword="true" /> when the L0/L1 question catalog may be read (includes post-submit parents).</summary>
    public static bool AllowsQuestionSelectionRead(DraftRequestStatus status) =>
        status is DraftRequestStatus.Drafting
            or DraftRequestStatus.Admitted
            or DraftRequestStatus.Submitted
            or DraftRequestStatus.RunSpawned;

    /// <summary>Returns <see langword="true" /> when pre-run intake reasoning may be invoked (SAQ-013).</summary>
    public static bool AllowsReasoning(DraftRequestStatus status) =>
        status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

    /// <summary>Returns <see langword="true" /> when a what-if branch may be cloned from the draft (R12).</summary>
    public static bool AllowsBranch(DraftRequestStatus status) =>
        status is DraftRequestStatus.Admitted
            or DraftRequestStatus.Submitted
            or DraftRequestStatus.RunSpawned;

    /// <summary>Returns <see langword="true" /> when admission may be requested.</summary>
    public static bool AllowsAdmission(DraftRequestStatus status) => status == DraftRequestStatus.Drafting;

    /// <summary>Returns <see langword="true" /> when submit may be requested.</summary>
    public static bool AllowsSubmit(DraftRequestStatus status) => status == DraftRequestStatus.Admitted;

    /// <summary>Returns <see langword="true" /> when submit may replay an already-spawned draft (idempotent retry).</summary>
    public static bool AllowsSubmitReplay(DraftRequestStatus status) => status == DraftRequestStatus.RunSpawned;

    /// <summary>Returns <see langword="true" /> when abandon may be requested.</summary>
    public static bool AllowsAbandon(DraftRequestStatus status) =>
        status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

    /// <summary>Returns <see langword="true" /> when an admitted draft may return to drafting.</summary>
    public static bool AllowsReopen(DraftRequestStatus status) => status == DraftRequestStatus.Admitted;
}
