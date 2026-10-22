namespace ArchLucid.Application.Drafts;

/// <summary>Result of <see cref="IDraftAdmissionGate.Evaluate" />.</summary>
public sealed class DraftAdmissionEvaluation
{
    public bool Admitted
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
