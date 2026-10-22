using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class ComparisonsCommand
{
    private static async Task<int> ReplayAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine(
                "Usage: archlucid comparisons replay <comparisonRecordId> [--format <markdown|html|docx|pdf>] [--mode <artifact|regenerate|verify>] [--profile <profile>] [--persist] [--out <path>] [--force]");

            return CliExitCode.UsageError;
        }

        string comparisonRecordId = args[0];
        string format = "markdown";
        string mode = "artifact";
        string? profile = null;
        bool persist = false;
        string? outPath = null;
        bool force = false;

        for (int i = 1; i < args.Length; i++)

            switch (args[i])
            {
                case "--format" when i + 1 < args.Length:
                    format = args[++i];
                    break;
                case "--mode" when i + 1 < args.Length:
                    mode = args[++i];
                    break;
                case "--profile" when i + 1 < args.Length:
                    profile = args[++i];
                    break;
                case "--persist":
                    persist = true;
                    break;
                case "--out" when i + 1 < args.Length:
                    outPath = args[++i];
                    break;
                case "--force":
                    force = true;
                    break;
            }

        bool ok = await client.ReplayComparisonToFileAsync(comparisonRecordId, format, mode, profile, persist, outPath,
            force);

        return ok ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static async Task<int> ReplayBatchAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine(
                "Usage: archlucid comparisons replay-batch <id1,id2,...> [--format <markdown|html|docx|pdf>] [--mode <artifact|regenerate|verify>] [--profile <profile>] [--persist] [--out <path>] [--force]");

            return CliExitCode.UsageError;
        }

        List<string> ids = args[0]
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        string format = "markdown";
        string mode = "artifact";
        string? profile = null;
        bool persist = false;
        string? outPath = null;
        bool force = false;

        for (int i = 1; i < args.Length; i++)

            switch (args[i])
            {
                case "--format" when i + 1 < args.Length:
                    format = args[++i];
                    break;
                case "--mode" when i + 1 < args.Length:
                    mode = args[++i];
                    break;
                case "--profile" when i + 1 < args.Length:
                    profile = args[++i];
                    break;
                case "--persist":
                    persist = true;
                    break;
                case "--out" when i + 1 < args.Length:
                    outPath = args[++i];
                    break;
                case "--force":
                    force = true;
                    break;
            }

        bool ok = await client.ReplayComparisonsBatchToZipAsync(ids, format, mode, profile, persist, outPath, force);

        return ok ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static async Task<int> DiagnosticsAsync(ArchLucidApiClient client, string[] args)
    {
        int limit = 20;
        bool asJson = false;
        bool asTable = false;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--limit" && i + 1 < args.Length && int.TryParse(args[i + 1], out int parsed))
            {
                limit = parsed;
                i++;
            }

            if (args[i] == "--json")

                asJson = true;

            if (args[i] == "--table")

                asTable = true;
        }

        ArchLucidApiClient.ReplayDiagnostics? diagnostics = await client.GetReplayDiagnosticsAsync(limit);

        if (diagnostics is null)
        {
            Console.WriteLine("Failed to get replay diagnostics (unauthorized or request failed).");

            return CliExitCode.OperationFailed;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(diagnostics, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            return CliExitCode.Success;
        }

        if (asTable)
        {
            PrintReplayDiagnosticsTable(diagnostics.RecentReplays);

            return CliExitCode.Success;
        }

        foreach (ArchLucidApiClient.ReplayDiagnosticsEntry e in diagnostics.RecentReplays)

            Console.WriteLine(
                $"{e.TimestampUtc:O} | {e.ComparisonRecordId} | {e.ComparisonType} | {e.Format} | {e.ReplayMode} | Success={e.Success} | {e.DurationMs}ms | MetaOnly={e.MetadataOnly} | Persisted={e.PersistedReplayRecordId} | Err={e.ErrorMessage}");

        return CliExitCode.Success;
    }

    private static void PrintReplayDiagnosticsTable(IReadOnlyList<ArchLucidApiClient.ReplayDiagnosticsEntry> entries)
    {
        List<string[]> rows = entries.Select(e => new[]
            {
                e.TimestampUtc.ToString("O"), e.ComparisonRecordId, e.ComparisonType, e.Format, e.ReplayMode, e.Success ? "true" : "false",
                e.DurationMs.ToString(), e.MetadataOnly ? "true" : "false", e.PersistedReplayRecordId ?? "", e.ErrorMessage ?? ""
            })
            .ToList();

        string[] headers =
        [
            "TimestampUtc",
            "ComparisonRecordId",
            "Type",
            "Format",
            "Mode",
            "Success",
            "Ms",
            "MetaOnly",
            "PersistedReplayRecordId",
            "Error"
        ];

        rows.Insert(0, headers);

        int[] widths = new int[headers.Length];

        for (int c = 0; c < headers.Length; c++)

            widths[c] = rows.Max(r => r[c].Length);

        for (int i = 0; i < rows.Count; i++)
        {
            string line = string.Join(" | ", rows[i].Select((cell, idx) => cell.PadRight(widths[idx])));
            Console.WriteLine(line);

            if (i == 0)

                Console.WriteLine(string.Join("-+-", widths.Select(w => new string('-', w))));
        }
    }
}
