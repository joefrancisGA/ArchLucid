namespace ArchLucid.Application.Analysis;

/// <summary>Safe machine-readable reason for a result that cannot be reused or finalized.</summary>
internal sealed class AnalysisDependencyRejectionException(string stage, string reason)
    : AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed, reason: reason);
