namespace ArchLucid.Core.Runs;

/// <summary>Outcome of a run lifecycle precondition check (commit, result submit, finalize).</summary>
public readonly record struct RunStateTransitionCheck(bool IsAllowed, string? Message)
{
    public static RunStateTransitionCheck Allowed() => new(true, null);

    public static RunStateTransitionCheck Denied(string message) => new(false, message);
}
