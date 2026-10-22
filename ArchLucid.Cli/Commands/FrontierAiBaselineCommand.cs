using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class FrontierAiBaselineCommand
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

        FrontierAiBaselineOptions options;

        try
        {
            options = FrontierAiBaselineOptions.Parse(args);
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

        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report;

        try
        {
            report = runner.Run(repositoryRoot, options);
        }
        catch (IOException ex)
        {
            Console.Error.WriteLine("[ArchLucid CLI] " + ex.Message);

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string artifactKey = FrontierAiBaselineOutputPaths.ResolveArtifactKey(report);
        FrontierAiBaselineOutputResolution outputPaths =
            FrontierAiBaselineOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        FrontierAiBaselineReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        string json = JsonSerializer.Serialize(finalReport, JsonOptions);
        string markdown = BuildMarkdown(finalReport);

        WriteArtifacts(outputPaths, json, markdown);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(json);
        }
        else
        {
            WriteConsoleSummary(finalReport);
            Console.WriteLine();
            Console.WriteLine(markdown);
        }

        return Task.FromResult(finalReport.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success);
    }

    private static void WriteArtifacts(
        FrontierAiBaselineOutputResolution outputPaths,
        string json,
        string markdown)
    {
        if (outputPaths.WillWriteJson)
        {
            string jsonDirectory = Path.GetDirectoryName(outputPaths.JsonPath!)!;

            if (!Directory.Exists(jsonDirectory))
                Directory.CreateDirectory(jsonDirectory);

            File.WriteAllText(outputPaths.JsonPath!, json, Encoding.UTF8);
        }

        if (outputPaths.WillWriteMarkdown)
        {
            string markdownDirectory = Path.GetDirectoryName(outputPaths.MarkdownPath!)!;

            if (!Directory.Exists(markdownDirectory))
                Directory.CreateDirectory(markdownDirectory);

            File.WriteAllText(outputPaths.MarkdownPath!, markdown, Encoding.UTF8);
        }
    }

    private static void WriteConsoleSummary(FrontierAiBaselineReport report)
    {
        Console.WriteLine("archlucid pilot frontier-ai-baseline");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"scoreboard: {report.ScoreboardPath}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        Console.WriteLine(new string('-', 72));

        foreach (FrontierAiBaselineCheckResult check in report.Checks)
        {
            Console.WriteLine($"[{FormatVerdict(check.Verdict)}] {check.Name}");
            Console.WriteLine($"        evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                Console.WriteLine($"        next: {check.Resolution}");
        }
    }

    internal static string BuildMarkdown(FrontierAiBaselineReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Frontier-AI baseline benchmark report");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");
        sb.AppendLine($"Scoreboard: `{report.ScoreboardPath}`");
        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"JSON artifact: `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"Markdown artifact: `{report.MarkdownArtifactPath}`");

        sb.AppendLine();
        sb.AppendLine("## Checks");
        sb.AppendLine();

        foreach (FrontierAiBaselineCheckResult check in report.Checks)
        {
            sb.AppendLine($"### {check.Name} — {FormatVerdict(check.Verdict)}");
            sb.AppendLine($"- Evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                sb.AppendLine($"- Next: {check.Resolution}");

            sb.AppendLine();
        }

        sb.AppendLine("## Logged sessions");
        sb.AppendLine();
        sb.AppendLine($"Count: {report.Sessions.Count}");
        sb.AppendLine();

        if (report.CohortMetrics is not null)
        {
            FrontierAiBaselineCohortMetrics metrics = report.CohortMetrics;

            sb.AppendLine("## Cohort metrics");
            sb.AppendLine();
            sb.AppendLine($"- Decision-change rate: {metrics.DecisionChangeRate:P0}");
            sb.AppendLine($"- Decision-delta PASS rate: {metrics.DecisionDeltaPassRate:P0}");
            sb.AppendLine($"- Median repeat-use intent: {metrics.MedianRepeatUseIntent:0.0}");
            sb.AppendLine($"- Top loss mode: {metrics.TopLossMode}");
            sb.AppendLine($"- Messaging ready: {metrics.MessagingReady}");
            sb.AppendLine();
        }

        sb.AppendLine("## Anti-claims");
        sb.AppendLine();
        sb.AppendLine("- Do not claim ArchLucid is smarter than frontier AI.");
        sb.AppendLine("- Do not publish invented benchmark percentages from this scoreboard.");
        sb.AppendLine("- Do not treat simulator rows as live customer proof.");

        return sb.ToString();
    }

    private static string FormatVerdict(FrontierAiBaselineVerdict verdict)
    {
        return verdict switch
        {
            FrontierAiBaselineVerdict.Pass => "PASS",
            FrontierAiBaselineVerdict.Warn => "WARN",
            FrontierAiBaselineVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown frontier-AI baseline verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot frontier-ai-baseline [--scoreboard <path>] [--init-scoreboard] " +
            "[--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--json]");
    }
}
