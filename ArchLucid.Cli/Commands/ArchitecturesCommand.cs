using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification =
    "CLI architectures subcommands orchestrate HTTP via ArchLucidApiClient (excluded from coverage); exercised via unit and smoke tests.")]
internal static partial class ArchitecturesCommand
{
    internal const string ArchitectureNounHelp =
        "Architecture identities are durable customer objects. Draft ids and review run ids are separate — use `archlucid draft` and `archlucid status` for those.";

    public static async Task<int> RunAsync(string[] args)
    {
        if (args.Length == 0)
        {
            WriteUsage();

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
            case "get":
                return await GetAsync(client, args.Skip(1).ToArray());
            default:
                Console.WriteLine($"Unknown subcommand for architectures: {sub}");
                WriteUsage();

                return CliExitCode.UsageError;
        }
    }

    private static void WriteUsage()
    {
        Console.WriteLine("Usage: archlucid architectures list [--page <n>] [--page-size <n>] [--json|--table]");
        Console.WriteLine("   or: archlucid architectures get <architectureId> [--json]");
        Console.WriteLine(ArchitectureNounHelp);
    }
}
