namespace ArchLucid.Application.Analysis;

internal sealed record AnalysisDependencyDecision(AnalysisDependencyAction Action, string Reason, string? Trigger = null)
{
    public string ActionName => Action switch
    {
        AnalysisDependencyAction.Reuse => "reuse",
        AnalysisDependencyAction.Recompute => "recompute",
        AnalysisDependencyAction.Blocked => "blocked",
        _ => throw new ArgumentOutOfRangeException(nameof(Action)),
    };
}
