namespace ArchLucid.Core.Support;

/// <summary>
///     Shared support-bundle entry names so API-assembled and CLI-assembled ZIPs stay aligned.
/// </summary>
public static class SupportBundleLayout
{
    public const string NextStepsFileName = "next-steps.json";

    /// <summary>Heuristic log scan written at bundle root (CLI and server-assembled ZIPs).</summary>
    public const string DiagnosticsSummaryFileName = SupportBundleLogDiagnosticsAnalyzer.DiagnosticsSummaryFileName;
}
