namespace ArchLucid.Application.Drafts;

/// <summary>Result of <see cref="IDraftSemanticAdmissionEvaluator.EvaluateAsync" />.</summary>
public sealed class DraftSemanticAdmissionEvaluation
{
    public DraftSemanticAdmissionDispositionKind Disposition
    {
        get;
        init;
    }

    public string? RedirectReason
    {
        get;
        init;
    }
}
