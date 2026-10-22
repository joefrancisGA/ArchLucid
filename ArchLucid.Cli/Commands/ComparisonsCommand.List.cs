using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class ComparisonsCommand
{
    private static async Task<int> ListAsync(ArchLucidApiClient client, string[] args)
    {
        string? type = null;
        string? leftRun = null;
        string? rightRun = null;
        string? leftExport = null;
        string? rightExport = null;
        string? label = null;
        string? tag = null;
        string? tags = null;
        // Empty string keeps the `cursor` query key present so the API takes the keyset path (not offset/skip).
        string cursor = "";
        string sortBy = "createdUtc";
        string sortDir = "desc";
        int skip = 0;
        int limit = 20;
        bool asJson = false;
        bool asTable = false;

        for (int i = 0; i < args.Length; i++)

            switch (args[i])
            {
                case "--type" when i + 1 < args.Length:
                    type = args[++i];
                    break;
                case "--left-run" when i + 1 < args.Length:
                    leftRun = args[++i];
                    break;
                case "--right-run" when i + 1 < args.Length:
                    rightRun = args[++i];
                    break;
                case "--left-export" when i + 1 < args.Length:
                    leftExport = args[++i];
                    break;
                case "--right-export" when i + 1 < args.Length:
                    rightExport = args[++i];
                    break;
                case "--label" when i + 1 < args.Length:
                    label = args[++i];
                    break;
                case "--tag" when i + 1 < args.Length:
                    tag = args[++i];
                    break;
                case "--tags" when i + 1 < args.Length:
                    tags = args[++i];
                    break;
                case "--cursor" when i + 1 < args.Length:
                    cursor = args[++i];
                    break;
                case "--sort-by" when i + 1 < args.Length:
                    sortBy = args[++i];
                    break;
                case "--sort" when i + 1 < args.Length:
                    sortDir = args[++i];
                    break;
                case "--skip" when i + 1 < args.Length && int.TryParse(args[i + 1], out int parsedSkip):
                    skip = parsedSkip;
                    i++;
                    break;
                case "--limit" when i + 1 < args.Length && int.TryParse(args[i + 1], out int parsed):
                    limit = parsed;
                    i++;
                    break;
                case "--json":
                    asJson = true;
                    break;
                case "--table":
                    asTable = true;
                    break;
            }

        ArchLucidApiClient.ComparisonHistoryResult? result = await client.SearchComparisonsAsync(
            type,
            leftRun,
            rightRun,
            leftExport,
            rightExport,
            label,
            tag,
            tags,
            sortBy,
            sortDir,
            cursor,
            skip,
            limit);

        if (result is null)
        {
            Console.WriteLine("No comparison records found or request failed.");

            return CliExitCode.OperationFailed;
        }

        if (result.Records.Count == 0)
        {
            Console.WriteLine("No comparison records matched the filters.");

            return CliExitCode.Success;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(result, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            if (string.IsNullOrWhiteSpace(result.NextCursor))
                return CliExitCode.Success;

            Console.WriteLine();
            Console.WriteLine($"nextCursor: {result.NextCursor}");

            return CliExitCode.Success;
        }

        if (asTable)
        {
            PrintComparisonTable(result.Records);

            return CliExitCode.Success;
        }

        foreach (ArchLucidApiClient.ComparisonRecordSummary r in result.Records)
        {
            string labelPart = string.IsNullOrEmpty(r.Label) ? "" : $" Label={r.Label}";
            string tagsPart = r.Tags.Count == 0 ? "" : " Tags=[" + string.Join(",", r.Tags) + "]";
            Console.WriteLine(
                $"{r.CreatedUtc:O} | {r.ComparisonRecordId} | {r.ComparisonType} | LeftRun={r.LeftRunId} RightRun={r.RightRunId}{labelPart}{tagsPart}");
        }

        return CliExitCode.Success;
    }

    private static void PrintComparisonTable(IReadOnlyList<ArchLucidApiClient.ComparisonRecordSummary> records)
    {
        List<string[]> rows = records.Select(r => new[]
            {
                r.CreatedUtc.ToString("O"), r.ComparisonRecordId, r.ComparisonType, r.LeftRunId ?? "", r.RightRunId ?? "", r.Label ?? "",
                r.Tags.Count == 0 ? "" : string.Join(",", r.Tags)
            })
            .ToList();

        string[] headers =
        [
            "CreatedUtc", "ComparisonRecordId", "Type", "LeftRunId", "RightRunId", "Label", "Tags"
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
