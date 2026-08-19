using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ArchLucid.Core.Support;

/// <summary>
///     Scans support-bundle log excerpts for common failure signatures and produces a plain-text triage summary.
/// </summary>
public static partial class SupportBundleLogDiagnosticsAnalyzer
{
    public const string DiagnosticsSummaryFileName = "diagnostics-summary.txt";

    private static readonly Regex Status401Pattern = StatusCodePattern("401");
    private static readonly Regex Status429Pattern = StatusCodePattern("429");
    // ReSharper disable once InconsistentNaming
    private static readonly Regex Status5xxPattern = new(@"\b5\d{2}\b", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    ///     Builds <c>diagnostics-summary.txt</c> content from optional log text (for example CLI <c>logs.json</c> excerpt).
    /// </summary>
    public static string BuildSummary(string? logText, DateTimeOffset analyzedUtc)
    {
        string normalized = logText?.Trim() ?? string.Empty;
        StringBuilder body = new();
        body.AppendLine("ArchLucid support bundle — automated log diagnostics");
        body.AppendLine("=====================================================");
        body.Append("Analyzed (UTC): ").AppendLine(analyzedUtc.UtcDateTime.ToString("O", CultureInfo.InvariantCulture));
        body.AppendLine();

        if (normalized.Length == 0)
        {
            body.AppendLine("No log excerpt was available in this bundle.");
            body.AppendLine("Attach API host stdout / container logs or re-run the CLI with outputs/last-run.log present.");
            body.AppendLine();
            body.AppendLine("Potential issues: (none detected — no log text to scan)");

            return body.ToString();
        }

        IReadOnlyList<SupportBundleLogDiagnosticFinding> findings = Analyze(normalized);
        body.AppendLine("Potential issues:");

        if (findings.Count == 0)
        {
            body.AppendLine("  (none detected — no timeout, auth, rate-limit, or server-error signatures in the excerpt)");
        }
        else
        {
            foreach (SupportBundleLogDiagnosticFinding finding in findings)
            {
                body.Append("  - ").Append(finding.Title);

                if (finding.OccurrenceCount > 1)
                {
                    body.Append(" (").Append(finding.OccurrenceCount.ToString(CultureInfo.InvariantCulture)).Append(" matches)");
                }

                body.AppendLine();
                body.Append("    ").AppendLine(finding.Guidance);
            }
        }

        body.AppendLine();
        body.AppendLine("Notes");
        body.AppendLine("-----");
        body.AppendLine("This summary is heuristic only — confirm against health.json and API host logs.");
        body.AppendLine("Redaction in logs.json may hide tokens; correlation IDs appear as structured log properties.");

        return body.ToString();
    }

    /// <summary>
    ///     Returns ordered findings (highest severity first) with occurrence counts.
    /// </summary>
    public static IReadOnlyList<SupportBundleLogDiagnosticFinding> Analyze(string logText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(logText);

        List<SupportBundleLogDiagnosticFinding> findings = [];

        int timeoutCount = CountMatches(TimeoutPattern(), logText);

        if (timeoutCount > 0)
        {
            findings.Add(new SupportBundleLogDiagnosticFinding(
                "Timeouts or deadline exceeded",
                timeoutCount,
                "Check downstream latency, SQL connection pool saturation, and AgentExecution timeouts. "
                + "Correlate with GET /health/ready and problem JSON correlationId."));
        }

        int unauthorizedCount = CountMatches(Status401Pattern, logText)
            + CountMatches(UnauthorizedTextPattern(), logText);

        if (unauthorizedCount > 0)
        {
            findings.Add(new SupportBundleLogDiagnosticFinding(
                "Authentication failures (401 / Unauthorized)",
                unauthorizedCount,
                "Verify ArchLucidAuth mode, API key / bearer token, Entra app registration, and tenant scope headers."));
        }

        int rateLimitCount = CountMatches(Status429Pattern, logText)
            + CountMatches(RateLimitTextPattern(), logText);

        if (rateLimitCount > 0)
        {
            findings.Add(new SupportBundleLogDiagnosticFinding(
                "Rate limiting (429 / throttling)",
                rateLimitCount,
                "Reduce request burst rate, honor Retry-After when present, and review ArchLucid API rate limits per tenant."));
        }

        int serverErrorCount = CountMatches(Status5xxPattern, logText)
            + CountMatches(ServerErrorTextPattern(), logText);

        if (serverErrorCount > 0)
        {
            findings.Add(new SupportBundleLogDiagnosticFinding(
                "Upstream or API server errors (5xx)",
                serverErrorCount,
                "Inspect API host logs around the timestamps, SQL availability, and external integration circuit-breaker state."));
        }

        int transportCount = CountMatches(TransportFaultPattern(), logText);

        if (transportCount > 0)
        {
            findings.Add(new SupportBundleLogDiagnosticFinding(
                "Network / transport faults",
                transportCount,
                "Check DNS, TLS certificates, firewall rules, and private-link reachability to dependencies."));
        }

        return findings;
    }

    private static int CountMatches(Regex pattern, string text)
    {
        return pattern.Matches(text).Count;
    }

    private static Regex StatusCodePattern(string statusCode) =>
        new(@"\b" + statusCode + @"\b", RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    [GeneratedRegex(
        @"\b(timeout|timed\s+out|deadline\s+exceeded|TaskCanceledException|OperationCanceledException)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex TimeoutPattern();

    [GeneratedRegex(@"\b(unauthorized|invalid\s+token|authentication\s+failed)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex UnauthorizedTextPattern();

    [GeneratedRegex(@"\b(too\s+many\s+requests|rate\s+limit|throttl)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex RateLimitTextPattern();

    [GeneratedRegex(@"\b(internal\s+server\s+error|bad\s+gateway|service\s+unavailable|gateway\s+timeout)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ServerErrorTextPattern();

    [GeneratedRegex(
        @"\b(HttpRequestException|connection\s+refused|connection\s+reset|no\s+such\s+host|SSL\s+handshake)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex TransportFaultPattern();
}
