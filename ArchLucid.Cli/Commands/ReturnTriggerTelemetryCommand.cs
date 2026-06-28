using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class ReturnTriggerTelemetryCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public static Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        ReturnTriggerTelemetryOptions options;

        try
        {
            options = ReturnTriggerTelemetryOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        if (repositoryRoot is null)
        {
            Console.Error.WriteLine("[ArchLucid CLI] Could not resolve repository root. Run from the ArchLucid repo.");

            return Task.FromResult(CliExitCode.ConfigurationError);
        }

        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(options.RulesPath);
        ReturnTriggerTelemetryRunner runner = new();
        ReturnTriggerTelemetryReport report = runner.Run(repositoryRoot, options, rules);

        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = BuildMarkdown(report);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            File.WriteAllText(options.JsonOutPath, json, Encoding.UTF8);

        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            File.WriteAllText(options.MarkdownOutPath, markdown, Encoding.UTF8);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(json);
        }
        else
        {
            WriteConsoleSummary(report);
            Console.WriteLine();
            Console.WriteLine(markdown);
        }

        return Task.FromResult(report.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success);
    }

    private static void WriteConsoleSummary(ReturnTriggerTelemetryReport report)
    {
        Console.WriteLine("archlucid pilot return-trigger-telemetry");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"ledger: {report.LedgerDirectory}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");
        Console.WriteLine(new string('-', 72));

        foreach (ReturnTriggerTelemetryCheckResult check in report.Checks)
        {
            Console.WriteLine($"[{FormatVerdict(check.Verdict)}] {check.Name}");
            Console.WriteLine($"        evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                Console.WriteLine($"        next: {check.Resolution}");
        }
    }

    private static string BuildMarkdown(ReturnTriggerTelemetryReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Principal-architect return-trigger telemetry");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");
        sb.AppendLine($"Ledger: `{report.LedgerDirectory}`");
        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");
        sb.AppendLine();

        if (report.CohortMetrics is not null)
        {
            ReturnTriggerTelemetryCohortMetrics metrics = report.CohortMetrics;

            sb.AppendLine("## Cohort metrics");
            sb.AppendLine();
            sb.AppendLine($"- Sessions loaded: {metrics.SessionCount}");
            sb.AppendLine($"- Positive reuse intent: {metrics.PositiveReuseIntentCount} ({metrics.PositiveReuseFraction.ToString("P0", CultureInfo.InvariantCulture)})");
            sb.AppendLine($"- Dismissal observed: {metrics.DismissalObservedCount}");
            sb.AppendLine($"- Top return trigger: **{metrics.TopReturnTriggerCode}**");
            sb.AppendLine($"- Top dismissal trigger: **{metrics.TopDismissalTriggerCode}**");
            sb.AppendLine();
        }

        sb.AppendLine("## Checks");
        sb.AppendLine();

        foreach (ReturnTriggerTelemetryCheckResult check in report.Checks)
        {
            sb.AppendLine($"### {check.Name} — {FormatVerdict(check.Verdict)}");
            sb.AppendLine($"- Evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                sb.AppendLine($"- Next: {check.Resolution}");

            sb.AppendLine();
        }

        if (report.ReturnTriggerCounts.Count > 0)
        {
            sb.AppendLine("## Return-trigger counts");
            sb.AppendLine();

            foreach (KeyValuePair<string, int> pair in report.ReturnTriggerCounts.OrderByDescending(static entry => entry.Value))
                sb.AppendLine($"- {pair.Key}: {pair.Value}");

            sb.AppendLine();
        }

        if (report.DismissalTriggerCounts.Count > 0)
        {
            sb.AppendLine("## Dismissal-trigger counts");
            sb.AppendLine();

            foreach (KeyValuePair<string, int> pair in report.DismissalTriggerCounts.OrderByDescending(static entry => entry.Value))
                sb.AppendLine($"- {pair.Key}: {pair.Value}");

            sb.AppendLine();
        }

        sb.AppendLine("## Notes");
        sb.AppendLine();
        sb.AppendLine("- Aggregates sanitized principal-architect dismissal, reuse, and return-trigger JSON logs.");
        sb.AppendLine("- Non-zero exit when cohort guardrails fail or required fixture assets are missing.");

        return sb.ToString();
    }

    private static string FormatVerdict(ReturnTriggerTelemetryVerdict verdict)
    {
        return verdict switch
        {
            ReturnTriggerTelemetryVerdict.Pass => "PASS",
            ReturnTriggerTelemetryVerdict.Warn => "WARN",
            ReturnTriggerTelemetryVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown return-trigger telemetry verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot return-trigger-telemetry [--ledger-dir <path>] [--rules <path>] "
            + "[--json-out <path>] [--markdown-out <path>] [--json]");
    }
}
