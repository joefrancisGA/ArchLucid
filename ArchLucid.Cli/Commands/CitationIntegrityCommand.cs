using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class CitationIntegrityCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        CitationIntegrityOptions options;

        try
        {
            options = CitationIntegrityOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            WriteUsage();

            return CliExitCode.UsageError;
        }

        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        if (repositoryRoot is null)
        {
            Console.Error.WriteLine("[ArchLucid CLI] Could not resolve repository root. Run from the ArchLucid repo.");

            return CliExitCode.ConfigurationError;
        }

        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(options.RulesPath);
        CitationIntegrityRunner runner = new();
        CitationIntegrityReport report;

        if (options.IncludeApi)
        {
            ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
            string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
            string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

            if (urlError is not null)
            {
                await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

                return CliExitCode.ConfigurationError;
            }

            using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl, config);
            report = await runner.RunWithApiAsync(repositoryRoot, http, options, rules, cancellationToken);
        }
        else
        {
            report = runner.RunOffline(repositoryRoot, options, rules);
        }

        string artifactKey = CitationIntegrityOutputPaths.ResolveArtifactKey(report);
        CitationIntegrityOutputResolution outputPaths =
            CitationIntegrityOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        CitationIntegrityReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        string json = JsonSerializer.Serialize(finalReport, JsonOptions);
        string markdown = BuildMarkdown(finalReport);

        await WriteArtifactsAsync(outputPaths, json, markdown, cancellationToken);

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

        return finalReport.FailThresholdExceeded ? CliExitCode.OperationFailed : CliExitCode.Success;
    }

    private static async Task WriteArtifactsAsync(
        CitationIntegrityOutputResolution outputPaths,
        string json,
        string markdown,
        CancellationToken cancellationToken)
    {
        if (outputPaths.WillWriteJson)
        {
            string jsonDirectory = Path.GetDirectoryName(outputPaths.JsonPath!)!;

            if (!Directory.Exists(jsonDirectory))
                Directory.CreateDirectory(jsonDirectory);

            await File.WriteAllTextAsync(outputPaths.JsonPath!, json, Encoding.UTF8, cancellationToken);
        }

        if (outputPaths.WillWriteMarkdown)
        {
            string markdownDirectory = Path.GetDirectoryName(outputPaths.MarkdownPath!)!;

            if (!Directory.Exists(markdownDirectory))
                Directory.CreateDirectory(markdownDirectory);

            await File.WriteAllTextAsync(outputPaths.MarkdownPath!, markdown, Encoding.UTF8, cancellationToken);
        }
    }

    private static void WriteConsoleSummary(CitationIntegrityReport report)
    {
        Console.WriteLine("archlucid pilot citation-integrity");
        Console.WriteLine($"repo: {report.RepositoryRoot}");

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            Console.WriteLine($"api: {report.BaseUrl}");

        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");
        Console.WriteLine($"sample: {report.SampleSize} of {report.CommittedRunsConsidered} committed runs");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        Console.WriteLine(new string('-', 72));

        foreach (CitationIntegrityRunResult run in report.Runs)
        {
            Console.WriteLine($"[{FormatVerdict(run.Verdict)}] runId={run.RunId} agentResults={run.AgentResultCount}");

            foreach (CitationIntegrityIssue issue in run.Issues)
            {
                Console.WriteLine($"        [{FormatVerdict(issue.Verdict)}] {issue.ClaimCategory}: {issue.Reason}");
                Console.WriteLine($"        evidence: {issue.EvidencePointer}");
            }
        }
    }

    internal static string BuildMarkdown(CitationIntegrityReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Citation integrity sampler");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            sb.AppendLine($"API base URL: `{report.BaseUrl}`");

        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");
        sb.AppendLine($"Sample size: {report.SampleSize} (committed pool: {report.CommittedRunsConsidered})");
        sb.AppendLine($"Runs with FAIL issues: {report.RunsWithFailIssues} (threshold: {report.FailThreshold})");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"JSON artifact: `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"Markdown artifact: `{report.MarkdownArtifactPath}`");

        sb.AppendLine();
        sb.AppendLine("## Run results");
        sb.AppendLine();

        foreach (CitationIntegrityRunResult run in report.Runs)
        {
            sb.AppendLine($"### `{run.RunId}` — {FormatVerdict(run.Verdict)}");
            sb.AppendLine($"- Agent results scanned: {run.AgentResultCount}");

            if (run.Issues.Count == 0)
            {
                sb.AppendLine("- No citation integrity issues detected.");
                sb.AppendLine();

                continue;
            }

            sb.AppendLine("- Issues:");
            sb.AppendLine();

            foreach (CitationIntegrityIssue issue in run.Issues)
            {
                sb.AppendLine($"- **[{FormatVerdict(issue.Verdict)}]** {issue.ClaimCategory} ({issue.AgentType})");
                sb.AppendLine($"  - Reason: {issue.Reason}");
                sb.AppendLine($"  - Evidence: `{issue.EvidencePointer}`");
            }

            sb.AppendLine();
        }

        sb.AppendLine("## Notes");
        sb.AppendLine();
        sb.AppendLine("- Deterministic sampler over committed runs; offline fixtures default to `fixtures/citation-integrity/manifest.v1.json`.");
        sb.AppendLine("- Non-zero exit when FAIL run count meets or exceeds `--fail-threshold`.");

        return sb.ToString();
    }

    private static string FormatVerdict(CitationIntegrityVerdict verdict)
    {
        return verdict switch
        {
            CitationIntegrityVerdict.Pass => "PASS",
            CitationIntegrityVerdict.Warn => "WARN",
            CitationIntegrityVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown citation integrity verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot citation-integrity [--fixtures-dir <path>] [--manifest <path>] [--rules <path>] "
            + "[--sample-size <n>] [--fail-threshold <n>] [--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--json]");
    }
}
