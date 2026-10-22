using System.Text.Json;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Cli.Commands;

internal static partial class ArchitecturesCommand
{
    private static async Task<int> ListAsync(ArchLucidApiClient client, string[] args)
    {
        int page = 1;
        int pageSize = 50;
        bool asJson = CliExecutionContext.JsonOutput;
        bool asTable = false;

        for (int i = 0; i < args.Length; i++)

            switch (args[i])
            {
                case "--page" when i + 1 < args.Length && int.TryParse(args[i + 1], out int parsedPage):
                    page = parsedPage;
                    i++;
                    break;
                case "--page-size" when i + 1 < args.Length && int.TryParse(args[i + 1], out int parsedPageSize):
                    pageSize = parsedPageSize;
                    i++;
                    break;
                case "--json":
                    asJson = true;
                    break;
                case "--table":
                    asTable = true;
                    break;
            }

        ArchitectureIdentityListPage? response =
            await client.ListArchitecturesAsync(page, pageSize);

        if (response is null)
        {
            Console.WriteLine("Failed to list architecture identities (unauthorized, out of scope, or request failed).");

            return CliExitCode.OperationFailed;
        }

        if (response.Items.Count == 0)
        {
            Console.WriteLine("No architecture identities matched the current scope.");

            return CliExitCode.Success;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(response, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            return CliExitCode.Success;
        }

        if (asTable)
        {
            PrintArchitectureListTable(response.Items);

            return CliExitCode.Success;
        }

        foreach (ArchitectureIdentityListItem item in response.Items)
        {
            Console.WriteLine(
                $"{item.ArchitectureId} | {item.DisplayName} | UpdatedUtc={item.UpdatedUtc:O} | DraftCount={item.DraftCount} | ReviewCount={item.ReviewCount}");
        }

        if (response.HasMore)
        {
            Console.WriteLine();
            Console.WriteLine($"Showing page {response.Page} (pageSize={response.PageSize}, totalCount={response.TotalCount}). Use --page to fetch more.");
        }

        return CliExitCode.Success;
    }

    internal static void PrintArchitectureListTable(IReadOnlyList<ArchitectureIdentityListItem> items)
    {
        List<string[]> rows = items
            .Select(item => new[]
            {
                item.ArchitectureId.ToString("D"),
                item.DisplayName,
                item.UpdatedUtc.ToString("O"),
                item.DraftCount.ToString(),
                item.ReviewCount.ToString(),
            })
            .ToList();

        string[] headers =
        [
            "ArchitectureId", "DisplayName", "UpdatedUtc", "DraftCount", "ReviewCount"
        ];

        rows.Insert(0, headers);

        int[] widths = new int[headers.Length];

        for (int c = 0; c < headers.Length; c++)

            widths[c] = rows.Max(row => row[c].Length);

        for (int i = 0; i < rows.Count; i++)
        {
            string line = string.Join(" | ", rows[i].Select((cell, idx) => cell.PadRight(widths[idx])));
            Console.WriteLine(line);

            if (i == 0)

                Console.WriteLine(string.Join("-+-", widths.Select(width => new string('-', width))));
        }
    }
}
