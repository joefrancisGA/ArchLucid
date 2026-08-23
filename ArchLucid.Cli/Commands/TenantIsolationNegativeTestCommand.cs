using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class TenantIsolationNegativeTestCommand
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

        TenantIsolationNegativeTestOptions options;

        try
        {
            options = TenantIsolationNegativeTestOptions.Parse(args);
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

        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report;

        if (!string.IsNullOrWhiteSpace(options.RunId))
        {
            ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
            string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
            string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

            if (urlError is not null)
            {
                await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

                return CliExitCode.ConfigurationError;
            }

            (string tenantId, string workspaceId, string projectId) = TenantIsolationNegativeTestRunner.ResolveAlternateScope(options);

            using HttpClient primaryClient = CliAuthorizedHttpClient.Create(baseUrl, config);
            using HttpClient alternateClient = CliAuthorizedHttpClient.Create(baseUrl, config);
            CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);

            report = await runner.RunLiveAsync(repositoryRoot, primaryClient, alternateClient, options, cancellationToken);
        }
        else
        {
            report = runner.RunOffline(repositoryRoot, options);
        }

        string artifactKey = TenantIsolationNegativeTestOutputPaths.ResolveArtifactKey(report);
        TenantIsolationNegativeTestOutputResolution outputPaths =
            TenantIsolationNegativeTestOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        TenantIsolationNegativeTestReport finalReport = report.WithOutputMetadata(
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

        return finalReport.OverallVerdict == TenantIsolationNegativeTestVerdict.Pass
            ? CliExitCode.Success
            : CliExitCode.OperationFailed;
    }

    private static async Task WriteArtifactsAsync(
        TenantIsolationNegativeTestOutputResolution outputPaths,
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

    private static void WriteConsoleSummary(TenantIsolationNegativeTestReport report)
    {
        Console.WriteLine("archlucid pilot tenant-isolation-negative-test");
        Console.WriteLine($"repo: {report.RepositoryRoot}");

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            Console.WriteLine($"api: {report.BaseUrl}");

        Console.WriteLine($"mode: {(report.LiveApiMode ? "live-api" : "offline-fixture")}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.PrimaryRunId))
            Console.WriteLine($"runId: {report.PrimaryRunId}");

        Console.WriteLine(new string('-', 72));

        foreach (TenantIsolationNegativeTestProbeResult probe in report.Probes)
        {
            Console.WriteLine($"[{FormatVerdict(probe.Verdict)}] {probe.Name}");
            Console.WriteLine($"        expected: {probe.ExpectedOutcome}; observed: {probe.ObservedOutcome}");

            if (!string.IsNullOrWhiteSpace(probe.CorrelationId))
                Console.WriteLine($"        correlationId: {probe.CorrelationId}");
        }
    }

    internal static string BuildMarkdown(TenantIsolationNegativeTestReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Tenant isolation negative-test bundle");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            sb.AppendLine($"API base URL: `{report.BaseUrl}`");

        sb.AppendLine($"Mode: **{(report.LiveApiMode ? "live-api" : "offline-fixture")}**");
        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"JSON artifact: `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"Markdown artifact: `{report.MarkdownArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.PrimaryRunId))
            sb.AppendLine($"Primary runId: `{report.PrimaryRunId}`");

        if (!string.IsNullOrWhiteSpace(report.AlternateTenantId))
        {
            sb.AppendLine(
                $"Alternate scope: tenant `{report.AlternateTenantId}`, workspace `{report.AlternateWorkspaceId}`, project `{report.AlternateProjectId}`");
        }

        sb.AppendLine();
        sb.AppendLine("## Deny matrix");
        sb.AppendLine();
        sb.AppendLine("| Probe | Expected | Observed | Verdict | Correlation ID |");
        sb.AppendLine("| --- | --- | --- | --- | --- |");

        foreach (TenantIsolationNegativeTestProbeResult probe in report.Probes)
        {
            sb.AppendLine(
                $"| {EscapePipe(probe.Name)} | {EscapePipe(probe.ExpectedOutcome)} | {EscapePipe(probe.ObservedOutcome)} | {FormatVerdict(probe.Verdict)} | {EscapePipe(probe.CorrelationId ?? "-")} |");
        }

        sb.AppendLine();
        sb.AppendLine("## Notes");
        sb.AppendLine();
        sb.AppendLine("- Non-destructive cross-tenant read probes only; no authorization model changes.");
        sb.AppendLine("- Non-zero exit when any probe unexpectedly succeeds (cross-tenant leak).");
        sb.AppendLine("- Non-zero exit in live-api mode when cross-tenant isolation could not be verified (overall SKIP).");

        return sb.ToString();
    }

    private static string EscapePipe(string value) => value.Replace("|", "\\|", StringComparison.Ordinal);

    private static string FormatVerdict(TenantIsolationNegativeTestVerdict verdict)
    {
        return verdict switch
        {
            TenantIsolationNegativeTestVerdict.Pass => "PASS",
            TenantIsolationNegativeTestVerdict.Fail => "FAIL",
            TenantIsolationNegativeTestVerdict.Skip => "SKIP",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown tenant isolation verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot tenant-isolation-negative-test [--run-id <guid>] "
            + "[--alternate-tenant-id <guid>] [--alternate-workspace-id <guid>] [--alternate-project-id <guid>] "
            + "[--manifest <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--json]");
    }
}
