using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Serialization;

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

    private DraftRequestResponse draft = new();

    public DraftRequestResponse Draft
    {
        get => draft;
        set => draft = value ?? new DraftRequestResponse();
    }

    /// <summary>MUST-tier questions still required before submit (ADR 0051 deterministic termination).</summary>
    private IReadOnlyList<DraftElicitationQuestion> pendingMustQuestions = [];

    public IReadOnlyList<DraftElicitationQuestion> PendingMustQuestions
    {
        get => pendingMustQuestions;
        set => pendingMustQuestions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Keys of unanswered MUST questions stored on the draft document.</summary>
    private IReadOnlyList<string> requiredMustQuestionKeys = [];

    public IReadOnlyList<string> RequiredMustQuestionKeys
    {
        get => requiredMustQuestionKeys;
        set => requiredMustQuestionKeys = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Typed feasibility outcome with mandatory transparency trail (ADR 0050).</summary>
    private FeasibilityVerdict verdict = new();

    public FeasibilityVerdict Verdict
    {
        get => verdict;
        set => verdict = value ?? new FeasibilityVerdict();
    }
}
