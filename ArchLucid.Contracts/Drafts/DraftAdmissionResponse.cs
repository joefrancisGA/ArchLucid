using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of <c>POST /v1/architecture/draft/{draftId}/admit</c>.</summary>
public sealed class DraftAdmissionResponse
{
    public bool Admitted
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    /// <summary>Human-readable explanation when <see cref="Admitted" /> is false (redirect path).</summary>
    public string? RedirectReason
    {
        get;
        set;
    }

    public DraftRequestResponse Draft
    {
        get;
        set;
    } = new();

    /// <summary>MUST-tier questions still required before submit (ADR 0051 deterministic termination).</summary>
    public IReadOnlyList<DraftElicitationQuestion> PendingMustQuestions
    {
        get;
        set;
    } = [];

    /// <summary>Keys of unanswered MUST questions stored on the draft document.</summary>
    public IReadOnlyList<string> RequiredMustQuestionKeys
    {
        get;
        set;
    } = [];

    /// <summary>Typed feasibility outcome with mandatory transparency trail (ADR 0050).</summary>
    public FeasibilityVerdict Verdict
    {
        get;
        set;
    } = new();
}
