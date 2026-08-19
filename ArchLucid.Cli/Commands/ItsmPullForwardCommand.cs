using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class ItsmPullForwardCommand
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

        ItsmPullForwardOptions options;

        try
        {
            options = ItsmPullForwardOptions.Parse(args);
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

        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(repositoryRoot, options);
        string? baseUrl = null;

        if (options.IncludeApi)
        {
            ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
            baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
            string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

            if (urlError is not null)
            {
                await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

                return CliExitCode.ConfigurationError;
            }

            using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl, config);
            PilotPreflightRunner preflightRunner = new(http);
            PilotPreflightReport preflightReport = await preflightRunner.RunAsync(
                baseUrl,
                [],
                new PilotPreflightOptions { IncludeItsm = true },
                cancellationToken);
            PilotPreflightStepResult? itsmStep = preflightReport.Steps.FirstOrDefault(static step => step.Name == "itsm-health");

            if (itsmStep is not null)
            {
                List<ItsmPullForwardCheckResult> checks = report.Checks.ToList();
                checks.Add(ItsmPullForwardRunner.BuildApiHealthCheck(itsmStep));
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
            else
            {
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = report.Checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
        }

        string artifactKey = ItsmPullForwardOutputPaths.ResolveArtifactKey(report);
        ItsmPullForwardOutputResolution outputPaths =
            ItsmPullForwardOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        ItsmPullForwardReport finalReport = report.WithOutputMetadata(
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

        return finalReport.RequiresOwnerAction || HasBlockingInfrastructureIssue(finalReport.Checks)
            ? CliExitCode.OperationFailed
            : CliExitCode.Success;
    }

    private static async Task WriteArtifactsAsync(
        ItsmPullForwardOutputResolution outputPaths,
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

    private static bool HasBlockingInfrastructureIssue(IReadOnlyList<ItsmPullForwardCheckResult> checks)
    {
        return checks.Any(static check => check.Evidence.StartsWith("Missing", StringComparison.Ordinal));
    }

    private static void WriteConsoleSummary(ItsmPullForwardReport report)
    {
        Console.WriteLine("archlucid pilot itsm-pull-forward-gate");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"ledger: {report.LedgerDirectory}");
        Console.WriteLine($"recommendation: {FormatVerdict(report.Recommendation)}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        Console.WriteLine(new string('-', 72));

        foreach (ItsmPullForwardCheckResult check in report.Checks)
        {
            Console.WriteLine($"[{FormatVerdict(check.Verdict)}] {check.Name}");
            Console.WriteLine($"        evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                Console.WriteLine($"        next: {check.Resolution}");
        }
    }

    internal static string BuildMarkdown(ItsmPullForwardReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# ITSM pull-forward decision gate");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");
        sb.AppendLine($"Ledger directory: `{report.LedgerDirectory}`");
        sb.AppendLine($"Recommendation: **{FormatVerdict(report.Recommendation)}**");

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            sb.AppendLine($"API base URL: `{report.BaseUrl}`");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"JSON artifact: `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"Markdown artifact: `{report.MarkdownArtifactPath}`");

        sb.AppendLine();
        sb.AppendLine("## Trigger counts");
        sb.AppendLine();
        sb.AppendLine($"- Connector-primary blocker pilots: {report.Triggers.ConnectorPrimaryBlockerPilotCount}");
        sb.AppendLine($"- SOW-contingent on connector: {report.Triggers.SowContingentOnConnectorCount}");
        sb.AppendLine($"- Manual handoff dominates second review: {report.Triggers.ManualHandoffDominatesSecondReviewCount}");
        sb.AppendLine($"- Activated triggers: {report.Triggers.ActivatedTriggerCount} (pull-forward requires 2)");
        sb.AppendLine($"- Ledger files scanned: {report.LedgerFilesScanned}");
        sb.AppendLine();
        sb.AppendLine("## Checks");
        sb.AppendLine();

        foreach (ItsmPullForwardCheckResult check in report.Checks)
        {
            sb.AppendLine($"### {check.Name} — {FormatVerdict(check.Verdict)}");
            sb.AppendLine($"- Evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                sb.AppendLine($"- Next: {check.Resolution}");

            sb.AppendLine();
        }

        sb.AppendLine("## Default posture");
        sb.AppendLine();
        sb.AppendLine("- V1 ships outbound create + correlation + audit; V1.1 first-party connectors stay deferred.");
        sb.AppendLine("- Pull forward only when two independent market triggers fire and an owner approves scope change.");

        return sb.ToString();
    }

    private static string FormatVerdict(ItsmPullForwardVerdict verdict)
    {
        return verdict switch
        {
            ItsmPullForwardVerdict.Hold => "HOLD",
            ItsmPullForwardVerdict.Watch => "WATCH",
            ItsmPullForwardVerdict.PullForward => "PULL_FORWARD",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown ITSM pull-forward verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot itsm-pull-forward-gate [--ledger-dir <path>] [--evidence <path>] "
            + "[--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts]");
    }
}
