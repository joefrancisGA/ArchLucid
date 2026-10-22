using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid real-llm-evidence summarize --from-json</c> — internal release / QA summary from a captured fixture
///     (no cloud calls).
/// </summary>
internal static class RealLlmEvidenceSummarizeCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? path = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--from-json", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --from-json.");

                    return CliExitCode.UsageError;
                }

                path = args[++i];

                continue;
            }

            await Console.Error.WriteLineAsync($"Unexpected argument: {token}");

            return CliExitCode.UsageError;
        }

        if (string.IsNullOrWhiteSpace(path))
        {
            await Console.Error.WriteLineAsync("Usage: archlucid real-llm-evidence summarize --from-json <path>");

            return CliExitCode.UsageError;
        }

        if (!File.Exists(path))
        {
            await Console.Error.WriteLineAsync($"File not found: {path}");

            return CliExitCode.UsageError;
        }

        string json = await File.ReadAllTextAsync(path, cancellationToken);

        (int exit, string md) = Summarize(json);

        Console.Write(md);

        return exit;
    }

    /// <summary>Used by CLI tests without touching the file system.</summary>
    internal static (int ExitCode, string Markdown) Summarize(string json)
    {
        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        bool simulatorOnly = root.TryGetProperty("simulatorOnlyRelease", out JsonElement sim) && sim.GetBoolean();

        if (simulatorOnly)
        {
            const string md = """
                              ## Real-LLM session evidence — summary

                              **Posture:** `SKIPPED` — release is marked **simulator-only**; do not imply hosted real-LLM validation for this cut.

                              """;

            return (CliExitCode.Success, md);
        }

        bool redactionEnabled = root.TryGetProperty("promptRedactionEnabled", out JsonElement pre) && pre.GetBoolean();
        bool rawPromptIncluded = root.TryGetProperty("rawPromptIncludedInExport", out JsonElement raw) && raw.GetBoolean();
        string? deployment = root.TryGetProperty("deploymentId", out JsonElement dep) ? dep.GetString() : null;
        string? model = root.TryGetProperty("modelLabel", out JsonElement mod) ? mod.GetString() : null;
        int inputTok = root.TryGetProperty("inputTokens", out JsonElement it) ? it.GetInt32() : -1;
        int outputTok = root.TryGetProperty("outputTokens", out JsonElement ot) ? ot.GetInt32() : -1;
        decimal? cost = null;

        if (root.TryGetProperty("totalCostUsd", out JsonElement c) && c.ValueKind == JsonValueKind.Number)

            cost = c.GetDecimal();

        string? gate = root.TryGetProperty("qualityGateOutcome", out JsonElement q) ? q.GetString() : null;
        int findings = root.TryGetProperty("committedFindingsCount", out JsonElement f) ? f.GetInt32() : -1;
        bool chain = root.TryGetProperty("topFindingEvidenceChainResolved", out JsonElement ch) && ch.GetBoolean();
        string? report = root.TryGetProperty("reportRelativePath", out JsonElement rp) ? rp.GetString() : null;

        List<string> gaps = [];

        if (string.IsNullOrWhiteSpace(deployment))
            gaps.Add("deployment id missing");

        if (cost is null)
            gaps.Add("total cost USD missing");

        if (string.IsNullOrWhiteSpace(gate))
            gaps.Add("quality gate outcome missing");
        else if (!IsPassingQualityGateOutcome(gate))
            gaps.Add(FormattableString.Invariant($"quality gate outcome not passing: {gate}"));

        if (inputTok < 0 || outputTok < 0)
            gaps.Add("token totals incomplete");

        if (findings < 0)
            gaps.Add("committed findings count missing");

        if (!chain)
            gaps.Add("top finding evidence chain not resolved");

        if (rawPromptIncluded && !redactionEnabled)
            gaps.Add("raw prompt included while redaction disabled — unsafe for broad sharing");

        string posture = gaps.Count == 0 ? "COMPLETE" : "INCOMPLETE";

        StringBuilder sb = new();
        sb.AppendLine("## Real-LLM session evidence — summary");
        sb.AppendLine();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Evidence posture:** `{posture}`");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Prompt redaction policy enabled (export) | `{redactionEnabled}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Raw prompt bytes in export | `{rawPromptIncluded}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Deployment | `{deployment ?? "(missing)"}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Model label | `{model ?? "(not specified)"}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Input / output tokens | `{inputTok}` / `{outputTok}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Total cost (USD) | `{cost?.ToString(CultureInfo.InvariantCulture) ?? "(missing)"}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Quality gate outcome | `{gate ?? "(missing)"}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Committed findings count | `{findings}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Top finding evidence chain resolved | `{chain}` |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Report path (relative) | `{report ?? "(not specified)"}` |");
        sb.AppendLine();

        if (gaps.Count > 0)
        {
            sb.AppendLine("### Gaps");
            sb.AppendLine();

            foreach (string gap in gaps)
            {
                sb.Append("- ");
                sb.AppendLine(gap);
            }

            sb.AppendLine();
        }

        sb.AppendLine(
            "_Tooling summary only — not a buyer-facing attestation. Never paste raw prompts or secrets into tickets._");
        sb.AppendLine();

        int code = gaps.Count == 0 ? CliExitCode.Success : CliExitCode.OperationFailed;

        return (code, sb.ToString());
    }

    private static bool IsPassingQualityGateOutcome(string gate)
    {
        return string.Equals(gate, "pass", StringComparison.OrdinalIgnoreCase)
               || string.Equals(gate, "passed", StringComparison.OrdinalIgnoreCase)
               || string.Equals(gate, "accepted", StringComparison.OrdinalIgnoreCase)
               || string.Equals(gate, "success", StringComparison.OrdinalIgnoreCase);
    }
}
