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
        ShipGateEvidenceRunner runner = new(http);
        ShipGateEvidenceReport report = await runner.RunAsync(options.RunId, cancellationToken);

        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = BuildMarkdown(report);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            await File.WriteAllTextAsync(options.JsonOutPath, json, Encoding.UTF8, cancellationToken);

        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            await File.WriteAllTextAsync(options.MarkdownOutPath, markdown, Encoding.UTF8, cancellationToken);

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

        return report.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success;
    }

    private static void WriteConsoleSummary(ShipGateEvidenceReport report)
    {
        Console.WriteLine($"archlucid pilot ship-gate-evidence @ {report.BaseUrl}");
        Console.WriteLine($"runId: {report.RunId}");
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

    private static string BuildMarkdown(ShipGateEvidenceReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# ArchLucid V1 Ship-Gate Evidence");
        sb.AppendLine();
        sb.AppendLine($"- **Generated (UTC):** {report.GeneratedUtc:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"- **Base URL:** `{report.BaseUrl}`");
        sb.AppendLine($"- **Run ID:** `{report.RunId}`");
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
        sb.AppendLine($"- `GET /v1/architecture/run/{report.RunId}`");
        sb.AppendLine($"- `GET /v1/artifacts/runs/{report.RunId}/export`");
        sb.AppendLine($"- `GET /v1/architecture/run/{report.RunId}/traceability-bundle.zip`");
        sb.AppendLine("- `GET /v1/roi/executive-summary`");
        sb.AppendLine($"- `archlucid pilot citation-integrity --include-api` (Gate 2 embedded sampler for run `{report.RunId}`)");

        return sb.ToString();
    }

    private static string EscapePipe(string value) => value.Replace("|", "\\|", StringComparison.Ordinal);

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot ship-gate-evidence --run-id <guid> " +
            "[--api-base-url <url>] [--json-out <path>] [--markdown-out <path>] [--json]");
    }
}
