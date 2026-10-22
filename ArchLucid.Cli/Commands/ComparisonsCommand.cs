using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification =
    "CLI comparisons subcommands orchestrate HTTP via ArchLucidApiClient (excluded from coverage); exercised via manual CLI and API integration.")]
internal static partial class ComparisonsCommand
{
    public static async Task<int> RunAsync(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine(
                "Usage: archlucid comparisons list [--type <type>] [--left-run <runId>] [--right-run <runId>] [--tag <tag>] [--skip <n>] [--limit <n>] [--cursor <cursor>] [--sort-by <createdUtc|type|label|leftRunId|rightRunId>] [--sort <asc|desc>] [--json|--table]");
            Console.WriteLine(
                "   or: archlucid comparisons replay <comparisonRecordId> [--format <markdown|html|docx|pdf>] [--mode <artifact|regenerate|verify>] [--profile <profile>] [--persist] [--out <path>] [--force]");
            Console.WriteLine(
                "   or: archlucid comparisons replay-batch <id1,id2,...> [--format ...] [--mode ...] [--profile ...] [--persist] [--out <path>] [--force]");
            Console.WriteLine("   or: archlucid comparisons summary <comparisonRecordId> [--json]");
            Console.WriteLine("   or: archlucid comparisons drift <comparisonRecordId> [--json]");
            Console.WriteLine("   or: archlucid comparisons diagnostics [--limit <n>] [--json|--table]");
            Console.WriteLine("   or: archlucid comparisons tag <comparisonRecordId> [--label <label>] [--tag <t>]...");

            return CliExitCode.UsageError;
        }

        string sub = args[0];
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);

        ApiConnectionOutcome connection = await CliCommandShared.TryConnectToApiAsync(baseUrl);

        if (connection != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl);

        switch (sub)
        {
            case "list":
                return await ListAsync(client, args.Skip(1).ToArray());
            case "replay":
                return await ReplayAsync(client, args.Skip(1).ToArray());
            case "replay-batch":
                return await ReplayBatchAsync(client, args.Skip(1).ToArray());
            case "summary":
                return await SummaryAsync(client, args.Skip(1).ToArray());
            case "drift":
                return await DriftAsync(client, args.Skip(1).ToArray());
            case "diagnostics":
                return await DiagnosticsAsync(client, args.Skip(1).ToArray());
            case "tag":
                return await TagAsync(client, args.Skip(1).ToArray());
            default:
                Console.WriteLine($"Unknown subcommand for comparisons: {sub}");

                return CliExitCode.UsageError;
        }
    }

    private static async Task<int> TagAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: archlucid comparisons tag <comparisonRecordId> [--label <label>] [--tag <t>]...");

            return CliExitCode.UsageError;
        }

        string comparisonRecordId = args[0];
        string? label = null;
        List<string> tags = [];

        for (int i = 1; i < args.Length; i++)

            switch (args[i])
            {
                case "--label" when i + 1 < args.Length:
                    label = args[++i];
                    break;
                case "--tag" when i + 1 < args.Length:
                    tags.Add(args[++i]);
                    break;
            }

        bool ok = await client.UpdateComparisonRecordAsync(comparisonRecordId, label, tags);

        if (!ok)
        {
            Console.WriteLine("Update failed or comparison record not found.");

            return CliExitCode.OperationFailed;
        }

        Console.WriteLine($"Updated comparison record {comparisonRecordId}.");

        return CliExitCode.Success;
    }

    private static async Task<int> SummaryAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: archlucid comparisons summary <comparisonRecordId> [--json]");

            return CliExitCode.UsageError;
        }

        string comparisonRecordId = args[0];
        bool asJson = args.Any(a => a == "--json");
        ArchLucidApiClient.ComparisonSummary? summary = await client.GetComparisonSummaryAsync(comparisonRecordId);

        if (summary is null)
        {
            Console.WriteLine("Failed to get comparison summary (unauthorized, not found, or request failed).");

            return CliExitCode.OperationFailed;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(summary, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            return CliExitCode.Success;
        }

        Console.WriteLine(summary.Summary);

        return CliExitCode.Success;
    }

    private static async Task<int> DriftAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: archlucid comparisons drift <comparisonRecordId> [--json]");

            return CliExitCode.UsageError;
        }

        string comparisonRecordId = args[0];
        bool asJson = args.Any(a => a == "--json");
        ArchLucidApiClient.DriftAnalysis? drift = await client.GetComparisonDriftAsync(comparisonRecordId);

        if (drift is null)
        {
            Console.WriteLine("Failed to get drift analysis (unauthorized, not found, or request failed).");

            return CliExitCode.OperationFailed;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(drift, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            return CliExitCode.Success;
        }

        Console.WriteLine($"DriftDetected={drift.DriftDetected}");
        Console.WriteLine(drift.Summary);

        foreach (ArchLucidApiClient.DriftItem item in drift.Items.Take(25))

            Console.WriteLine($"- [{item.Category}] {item.Path}: {item.Description}");

        if (drift.Items.Count > 25)

            Console.WriteLine($"(showing 25 of {drift.Items.Count} items)");

        return CliExitCode.Success;
    }
}
