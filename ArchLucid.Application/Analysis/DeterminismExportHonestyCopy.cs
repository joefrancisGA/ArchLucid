using ArchLucid.Application.Determinism;

namespace ArchLucid.Application.Analysis;

/// <summary>Operator-facing determinism check lines for architecture analysis exports.</summary>
internal static class DeterminismExportHonestyCopy
{
    internal const string AgentResultsMatchedBaseline = "Baseline agent results matched the recorded replay.";

    internal const string AgentResultsDidNotMatchBaseline = "Baseline agent results did not match the recorded replay.";

    internal const string ManifestMatchedBaseline = "Baseline manifest matched the recorded replay.";

    internal const string ManifestDidNotMatchBaseline = "Baseline manifest did not match the recorded replay.";

    internal static string FormatAgentResultsMatch(bool matches) =>
        matches ? AgentResultsMatchedBaseline : AgentResultsDidNotMatchBaseline;

    internal const string NeitherReplayStoredManifestCopy =
        "Neither replay stored a manifest. This is not a stored manifest match.";

    internal static string FormatManifestMatch(bool matches) =>
        matches ? ManifestMatchedBaseline : ManifestDidNotMatchBaseline;

    internal static string FormatManifestMatch(DeterminismIterationResult iteration)
    {
        ArgumentNullException.ThrowIfNull(iteration);

        if (iteration.ManifestDriftWarnings.Any(static warning =>
                warning.StartsWith("Neither replay stored a manifest", StringComparison.Ordinal)))
        {
            return NeitherReplayStoredManifestCopy;
        }

        return FormatManifestMatch(iteration.MatchesBaselineManifest);
    }

    internal static string FormatReplayRunId(string? replayRunId) =>
        string.IsNullOrWhiteSpace(replayRunId) ? "Replay run id was not stored." : replayRunId.Trim();

    internal const string TraceParseSucceeded = "Parse result was stored as succeeded.";

    internal const string TraceParseFailed = "Parse result was stored as failed.";

    internal static string FormatTraceParseSucceeded(bool parseSucceeded) =>
        parseSucceeded ? TraceParseSucceeded : TraceParseFailed;

    internal static string FormatTraceErrorMessage(string? errorMessage, bool parseSucceeded) =>
        ArchitectureEvidenceRequestExport.FormatTraceErrorForExport(errorMessage, parseSucceeded);
}
