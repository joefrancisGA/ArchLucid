using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class PilotReadinessBundleCommand
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

        PilotReadinessBundleOptions options;

        try
        {
            options = PilotReadinessBundleOptions.Parse(args);
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

        bool needsApi = options.IncludeApi || !string.IsNullOrWhiteSpace(options.RunId);
        HttpClient? httpClient = null;
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = null;

        if (needsApi)
        {
            config = CliCommandShared.TryLoadConfigFromCwd();
            string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
            string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

            if (urlError is not null)
            {
                await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

                return CliExitCode.ConfigurationError;
            }

            httpClient = CliAuthorizedHttpClient.Create(baseUrl, config);
        }

        PilotReadinessBundleRunner runner = new();
        PilotReadinessBundleReport report;

        try
        {
            report = await runner.RunAsync(
                repositoryRoot,
                options,
                httpClient,
                config,
                args,
                cancellationToken);
        }
        catch (IOException ex)
        {
            Console.Error.WriteLine("[ArchLucid CLI] " + ex.Message);

            return CliExitCode.OperationFailed;
        }
        catch (InvalidOperationException ex)
        {
            Console.Error.WriteLine("[ArchLucid CLI] " + ex.Message);

            return CliExitCode.ConfigurationError;
        }
        finally
        {
            httpClient?.Dispose();
        }

        string artifactKey = PilotReadinessBundleOutputPaths.ResolveArtifactKey(report);
        PilotReadinessBundleOutputResolution outputPaths =
            PilotReadinessBundleOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        PilotReadinessBundleReport finalReport = report.WithOutputMetadata(
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

        return finalReport.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success;
    }

    private static async Task WriteArtifactsAsync(
        PilotReadinessBundleOutputResolution outputPaths,
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

    private static void WriteConsoleSummary(PilotReadinessBundleReport report)
    {
        Console.WriteLine("archlucid pilot readiness-bundle");
        Console.WriteLine($"repo: {report.RepositoryRoot}");

        if (!string.IsNullOrWhiteSpace(report.RunId))
            Console.WriteLine($"runId: {report.RunId}");

        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        Console.WriteLine(new string('-', 72));

        foreach (PilotReadinessBundleSlotResult slot in report.Slots)
        {
            Console.WriteLine($"[{FormatSlotVerdict(slot.Verdict)}] {slot.DisplayName}");
            Console.WriteLine($"        evidence: {slot.Evidence}");

            if (!string.IsNullOrWhiteSpace(slot.JsonArtifactPath))
                Console.WriteLine($"        json: {slot.JsonArtifactPath}");

            if (!string.IsNullOrWhiteSpace(slot.MarkdownArtifactPath))
                Console.WriteLine($"        markdown: {slot.MarkdownArtifactPath}");
        }
    }

    private static string BuildMarkdown(PilotReadinessBundleReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Pilot readiness release-train bundle");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");

        if (!string.IsNullOrWhiteSpace(report.RunId))
            sb.AppendLine($"Run id: `{report.RunId}`");

        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"JSON artifact: `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"Markdown artifact: `{report.MarkdownArtifactPath}`");

        sb.AppendLine();
        sb.AppendLine("## Bundle slots");
        sb.AppendLine();
        sb.AppendLine("| Slot | Verdict | Evidence | JSON | Markdown |");
        sb.AppendLine("|------|---------|----------|------|----------|");

        foreach (PilotReadinessBundleSlotResult slot in report.Slots)
        {
            string jsonPath = string.IsNullOrWhiteSpace(slot.JsonArtifactPath) ? "—" : $"`{slot.JsonArtifactPath}`";
            string markdownPath = string.IsNullOrWhiteSpace(slot.MarkdownArtifactPath)
                ? "—"
                : $"`{slot.MarkdownArtifactPath}`";
            string evidence = slot.Evidence.Replace("|", "\\|", StringComparison.Ordinal);

            sb.AppendLine(
                $"| {slot.DisplayName} | {FormatSlotVerdict(slot.Verdict)} | {evidence} | {jsonPath} | {markdownPath} |");
        }

        sb.AppendLine();
        sb.AppendLine("## Release-train usage");
        sb.AppendLine();
        sb.AppendLine("- Offline fixture replay: `archlucid pilot readiness-bundle`");
        sb.AppendLine("- Live release train: `archlucid pilot readiness-bundle --run-id <guid> [--include-api]`");
        sb.AppendLine("- Retain aggregate only on stdout: `--no-write-artifacts`");

        return sb.ToString();
    }

    private static string FormatVerdict(PilotReadinessBundleVerdict verdict) =>
        verdict switch
        {
            PilotReadinessBundleVerdict.Pass => "PASS",
            PilotReadinessBundleVerdict.Fail => "FAIL",
            PilotReadinessBundleVerdict.Unknown => "UNKNOWN",
            PilotReadinessBundleVerdict.Warn => "WARN",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown pilot readiness verdict."),
        };

    private static string FormatSlotVerdict(PilotReadinessBundleSlotVerdict verdict) =>
        verdict switch
        {
            PilotReadinessBundleSlotVerdict.Pass => "PASS",
            PilotReadinessBundleSlotVerdict.Fail => "FAIL",
            PilotReadinessBundleSlotVerdict.Unknown => "UNKNOWN",
            PilotReadinessBundleSlotVerdict.Warn => "WARN",
            PilotReadinessBundleSlotVerdict.Skipped => "SKIPPED",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown slot verdict."),
        };

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot readiness-bundle [--run-id <guid>] [--include-api] " +
            "[--ui-base-url <url>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--json]");
    }
}
