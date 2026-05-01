using System.Text;

using ArchLucid.Core.Support;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Plain-text index for pilots who open the folder before reading JSON (reduces archaeology).
/// </summary>
public static class SupportBundleReadme
{
    /// <summary>Written as <see cref="SupportBundleArchiveWriter.ReadmeFileName" /> next to JSON sections.</summary>
    public static string Build(
        string createdUtcIso,
        string apiBaseUrlRedacted,
        string cliWorkingDirectory,
        SupportBundleNextStepsDocument nextSteps)
    {
        if (nextSteps is null) throw new ArgumentNullException(nameof(nextSteps));

        StringBuilder summary = new();

        foreach (string line in nextSteps.SummaryLines)
        {
            summary.Append("   - ");
            summary.AppendLine(line);
        }

        return $"""
                ArchLucid support bundle
                ========================
                Generated (UTC): {createdUtcIso}
                CLI working directory: {cliWorkingDirectory}
                API base URL (redacted): {apiBaseUrlRedacted}

                Suggested next steps (generated — advisory)
                -------------------------------------------
                {summary}
                Read first (in order)
                ---------------------
                1. {SupportBundleLayout.NextStepsFileName} — machine-readable summary + hints (confirm with health.json)
                2. {SupportBundleArchiveWriter.HealthFileName}       — /health/live, /health/ready, /health (why the API may be unhealthy)
                3. {SupportBundleArchiveWriter.BuildFileName}        — CLI build + GET /version (server build identity)
                4. {SupportBundleArchiveWriter.ApiContractFileName} — GET /openapi/v1.json probe (contract endpoint up; body is truncated)
                5. {SupportBundleArchiveWriter.ConfigFileName} — archlucid.json summary (paths only; no secrets)
                6. {SupportBundleArchiveWriter.EnvironmentFileName} — safe env snapshot (sensitive names show (set)/(not set) only)
                7. {SupportBundleArchiveWriter.WorkspaceFileName}  — outputs folder stats
                8. {SupportBundleArchiveWriter.LogsFileName}         — optional local last-run excerpt
                9. {SupportBundleArchiveWriter.ReferencesFileName}   — doc links and correlation triage hints

                manifest.json includes triageReadOrder (same as above) and bundleFormatVersion.

                {SupportBundleNextStepsDocument.AdvisoryDisclaimer}

                Before you send this folder or zip externally: review all JSON; policy may require extra redaction.

                Correlation: use X-Correlation-ID / correlationId from API errors with server logs (see references.json).

                """;
    }
}
