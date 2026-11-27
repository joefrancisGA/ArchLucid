namespace ArchLucid.Application.Analysis;

/// <summary>A bounded execution outcome that must not be mistaken for an ordinary failed read or a complete run.</summary>
internal sealed class AnalysisStageExecutionException(string stage, string outcome, Exception? cause = null)
    : InvalidOperationException($"Analysis stage '{stage}' ended with outcome '{outcome}'.", cause)
{
    public string Stage { get; } = stage;
    public string Outcome { get; } = outcome;
}
