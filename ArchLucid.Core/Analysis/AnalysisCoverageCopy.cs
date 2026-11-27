using ArchLucid.Contracts.Analysis;

namespace ArchLucid.Core.Analysis;

/// <summary>Safe, bounded statements for generated documents. Coverage never implies approval.</summary>
public static class AnalysisCoverageCopy
{
    public static string Explain(AnalysisCoverageSummary coverage) => (coverage.State, coverage.Freshness) switch
    {
        (AnalysisCoverageStates.Complete, "historical") =>
            "Coverage was complete for the recorded analysis scope. It does not describe the current environment.",
        (AnalysisCoverageStates.Complete, "current") =>
            "Coverage was complete for the evaluated scope only.",
        (_, AnalysisCoverageStates.Stale) =>
            "Evidence is out of date. Do not infer absence of findings for the current environment.",
        (AnalysisCoverageStates.Pending, _) =>
            "Analysis is still pending. Absence of findings cannot be established.",
        (AnalysisCoverageStates.NotApplicable, _) =>
            "This analysis did not apply to the recorded scope.",
        (AnalysisCoverageStates.Failed, _) when coverage.Recovery == "retry_exhausted" =>
            "Analysis exhausted its retry budget. Absence of findings cannot be established.",
        (AnalysisCoverageStates.Incomplete, _) when coverage.AdvisoryOnlyDegradation =>
            "Advisory engine coverage was incomplete. Recorded findings remain usable, but absence of findings cannot be established.",
        _ => "Coverage was not verified as complete. Absence of findings cannot be established.",
    };
}
