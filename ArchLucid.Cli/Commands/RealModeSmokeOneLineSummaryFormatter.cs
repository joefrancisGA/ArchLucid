namespace ArchLucid.Cli.Commands;

/// <summary>
///     Formats a <see cref="RealModeSmokeReport" /> as a single greppable line for nightly staging on-call.
///     Format:
///     <c>PASS|FAIL host=&lt;url&gt; correlation=&lt;id&gt; runId=&lt;id&gt; status=&lt;status&gt; tokens=&lt;n&gt; failed=&lt;step&gt;</c>.
/// </summary>
public static class RealModeSmokeOneLineSummaryFormatter
{
    private const string NoneToken = "<none>";

    public static string Format(RealModeSmokeReport report, string baseUrl)
    {
        if (report is null)
            throw new ArgumentNullException(nameof(report));

        if (baseUrl is null)
            throw new ArgumentNullException(nameof(baseUrl));

        string verdict = report.AllPassed ? "PASS" : "FAIL";
        string correlation = OrNone(report.CorrelationId);
        string runId = OrNone(report.RunId);
        string status = OrNone(report.FinalRunStatus);
        string failedStep = report.AllPassed
            ? NoneToken
            : FirstFailedStepName(report) ?? "<unknown>";

        return
            $"{verdict} host={baseUrl} correlation={correlation} runId={runId} status={status} tokens={report.TotalLlmTokens} failed={failedStep}";
    }

    private static string OrNone(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? NoneToken : value;
    }

    private static string? FirstFailedStepName(RealModeSmokeReport report)
    {
        return (from step in report.Steps where !step.Passed select step.Name).FirstOrDefault();
    }
}
