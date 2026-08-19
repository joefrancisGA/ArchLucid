using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class ShipGateEvidenceCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        ShipGateEvidenceOptions options;

        try
        {
            options = ShipGateEvidenceOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            WriteUsage();

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl, config);
        ShipGateUiBaseUrlResolution uiOrigin = ShipGateUiBaseUrlResolver.Resolve(args, config);
        ShipGateEvidenceRunner runner = new(http, config);
        ShipGateEvidenceReport report = await runner.RunAsync(
            options.RunId,
            uiOrigin.BaseUrl,
            uiOrigin.Source,
            options.ToTenantIsolationOptions(),
            options.SkipClaimLint,
            cancellationToken);

        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();
        ShipGateEvidenceOutputResolution outputPaths = ShipGateEvidenceOutputPaths.Resolve(options, repositoryRoot, report.RunId);
        ShipGateEvidenceReport finalReport = report.WithOutputMetadata(
            repositoryRoot,
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        string json = JsonSerializer.Serialize(finalReport, JsonOptions);
        string markdown = BuildMarkdown(finalReport);

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

    private static void WriteConsoleSummary(ShipGateEvidenceReport report)
    {
        Console.WriteLine($"archlucid pilot ship-gate-evidence @ {report.BaseUrl}");
        Console.WriteLine($"runId: {report.RunId}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");

        if (!string.IsNullOrWhiteSpace(report.RepositoryRoot))
            Console.WriteLine($"repo: {report.RepositoryRoot}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        Console.WriteLine(new string('-', 72));

        foreach (ShipGateEvidenceGateResult gate in report.Gates.OrderBy(static g => g.GateNumber))
        {
            string label = gate.Verdict switch
            {
                ShipGateEvidenceVerdict.Pass => "PASS",
                ShipGateEvidenceVerdict.Fail => "FAIL",
                _ => "UNKNOWN",
            };

            Console.WriteLine($"[{label}] Gate {gate.GateNumber}: {gate.Name}");
            Console.WriteLine($"        evidence: {gate.Evidence}");

            if (!string.IsNullOrWhiteSpace(gate.FastestResolution))
                Console.WriteLine($"        next: {gate.FastestResolution}");
        }
    }

    internal static string BuildMarkdown(ShipGateEvidenceReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# ArchLucid V1 Ship-Gate Evidence");
        sb.AppendLine();
        sb.AppendLine($"- **Generated (UTC):** {report.GeneratedUtc:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"- **Base URL:** `{report.BaseUrl}`");
        sb.AppendLine($"- **Run ID:** `{report.RunId}`");
        sb.AppendLine($"- **Overall verdict:** **{FormatVerdict(report.OverallVerdict)}**");

        if (!string.IsNullOrWhiteSpace(report.RepositoryRoot))
            sb.AppendLine($"- **Repository:** `{report.RepositoryRoot}`");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            sb.AppendLine($"- **JSON artifact:** `{report.JsonArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            sb.AppendLine($"- **Markdown artifact:** `{report.MarkdownArtifactPath}`");

        if (!string.IsNullOrWhiteSpace(report.UiBaseUrl))
        {
            sb.AppendLine($"- **UI base URL:** `{report.UiBaseUrl}` (source: {report.UiBaseUrlSource ?? "unspecified"})");
        }

        sb.AppendLine();
        sb.AppendLine("## Gate Verdicts");
        sb.AppendLine();
        sb.AppendLine("| Gate | Verdict | Evidence | Fastest Resolution |");
        sb.AppendLine("|------|---------|----------|--------------------|");

        foreach (ShipGateEvidenceGateResult gate in report.Gates.OrderBy(static g => g.GateNumber))
        {
            string verdict = gate.Verdict switch
            {
                ShipGateEvidenceVerdict.Pass => "PASS",
                ShipGateEvidenceVerdict.Fail => "FAIL",
                _ => "UNKNOWN",
            };

            string evidence = EscapePipe(gate.Evidence);
            string resolution = EscapePipe(gate.FastestResolution ?? "-");

            sb.AppendLine($"| {gate.GateNumber}. {EscapePipe(gate.Name)} | {verdict} | {evidence} | {resolution} |");
        }

        sb.AppendLine();
        sb.AppendLine("## Evidence Links");
        sb.AppendLine();
        sb.AppendLine($"- `GET /v1/architecture/review/{report.RunId}`");
        sb.AppendLine($"- `GET /v1/architecture/review/{report.RunId}` (Gate 1 first-review completion signals)");
        sb.AppendLine($"- `GET /v1/architecture/reviews/{report.RunId}/provenance` (Gate 1 provenance graph probe)");
        sb.AppendLine($"- `GET /v1/pilots/runs/{report.RunId}/first-value-report` (Gate 4 Markdown export matrix + claim lint)");
        sb.AppendLine($"- `POST /v1/architecture/review/{report.RunId}/analysis-report/export/docx` (Gate 4 DOCX export matrix)");
        sb.AppendLine($"- `GET /v1/artifacts/runs/{report.RunId}/export` (Gate 4 run artifact ZIP export matrix)");
        sb.AppendLine($"- `GET /v1/architecture/review/{report.RunId}/traceability-bundle.zip` (Gate 4 traceability audit hand-off ZIP)");
        sb.AppendLine("- `GET /v1/roi/sponsor-report` (Gate 3 ROI coherence probe)");
        sb.AppendLine($"- `archlucid pilot citation-integrity --include-api` (Gate 2 embedded sampler for run `{report.RunId}`)");

        if (!string.IsNullOrWhiteSpace(report.UiBaseUrl))
        {
            sb.AppendLine($"- Operator UI route smoke @ `{report.UiBaseUrl}` (Gate 5 first-review spine)");
        }

        sb.AppendLine($"- `archlucid pilot tenant-isolation-negative-test --run-id {report.RunId}` (Gate 6 embedded cross-tenant deny probes)");

        return sb.ToString();
    }

    private static string EscapePipe(string value) => value.Replace("|", "\\|", StringComparison.Ordinal);

    private static string FormatVerdict(ShipGateEvidenceVerdict verdict)
    {
        return verdict switch
        {
            ShipGateEvidenceVerdict.Pass => "PASS",
            ShipGateEvidenceVerdict.Fail => "FAIL",
            ShipGateEvidenceVerdict.Unknown => "UNKNOWN",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown ship-gate evidence verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot ship-gate-evidence --run-id <guid> " +
            "[--api-base-url <url>] [--ui-base-url <url>] [--skip-ui-route-smoke] " +
            "[--alternate-tenant-id <guid>] [--alternate-workspace-id <guid>] [--alternate-project-id <guid>] " +
            "[--skip-claim-lint] [--no-write-artifacts] " +
            "[--json-out <path>] [--markdown-out <path>] [--json]");
    }
}
