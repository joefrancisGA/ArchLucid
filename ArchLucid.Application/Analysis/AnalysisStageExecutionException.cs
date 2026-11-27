namespace ArchLucid.Application.Analysis;

/// <summary>A bounded execution outcome that must not be mistaken for an ordinary failed read or a complete run.</summary>
internal class AnalysisStageExecutionException(string stage, string outcome, Exception? cause = null, string? reason = null)
    : InvalidOperationException($"Analysis stage '{stage}' ended with outcome '{outcome}'{(reason is null ? "" : $" ({reason})")}.", cause)
{
    public string Stage { get; } = stage;
    public string Outcome { get; } = outcome;
    public string? Reason { get; } = reason;
}
