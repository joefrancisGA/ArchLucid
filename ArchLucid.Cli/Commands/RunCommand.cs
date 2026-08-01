using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification =
    "CLI run subcommand orchestrates HTTP and filesystem via ArchLucidApiClient (excluded from coverage); exercised via manual CLI.")]
internal static class RunCommand
{
    public static async Task<int> RunAsync(string? idempotencyKey = null)
    {
        string projectRoot = Directory.GetCurrentDirectory();
        ArchLucidProjectScaffolder.ArchLucidCliConfig config;

        try
        {
            config = ArchLucidProjectScaffolder.LoadConfig(projectRoot);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");

            return CliExitCode.OperationFailed;
        }

        string briefPath = Path.Combine(projectRoot, config.Inputs.Brief);

        if (!File.Exists(briefPath))
        {
            Console.WriteLine($"Error: Brief file not found at {config.Inputs.Brief}");
            CliOperatorHints.WriteBriefMissingHint(config.Inputs.Brief);

            return CliExitCode.OperationFailed;
        }

        string briefContent = (await File.ReadAllTextAsync(briefPath)).Trim();

        if (briefContent.Length < 10)
        {
            Console.WriteLine("Error: Brief must be at least 10 characters (API requirement).");
            await Console.Error.WriteLineAsync(
                "Next: Edit inputs/brief.md (or the path in archlucid.json) with a longer description.");

            return CliExitCode.OperationFailed;
        }

        ArchitectureRequest request = CliCommandShared.BuildArchitectureRequest(config, briefContent);
        string baseUrl = CliCommandShared.GetBaseUrl(config);

        ApiConnectionOutcome connection = await CliCommandShared.TryConnectToApiAsync(baseUrl, config);

        if (connection != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl, config);

        Console.WriteLine($"Submitting request to {baseUrl}...");

        ArchLucidApiClient.CreateRunResult result = await client.CreateRunAsync(request, CancellationToken.None, idempotencyKey);

        if (!result.Success)
        {
            Console.WriteLine($"Error: {result.Error}");
            CliOperatorHints.WriteAfterApiFailure(result.StatusCode, result.Error);

            return CliExitCode.OperationFailed;
        }

        ArchLucidApiClient.CreateRunResponse resp = result.Response!;

        string outputsDir = Path.Combine(projectRoot, config.Outputs.LocalCacheDir);
        Directory.CreateDirectory(outputsDir);
        string summaryPath = Path.Combine(outputsDir, "run-summary.json");

        CliCommandShared.WriteRunSummary(
            summaryPath,
            baseUrl,
            resp.Run.RunId,
            resp.Run.RequestId,
            resp.Run.Status,
            resp.Run.CreatedUtc,
            resp.Tasks,
            null);

        Console.WriteLine();
        Console.WriteLine($"Run created: {resp.Run.RunId}");
        Console.WriteLine($"Status: {resp.Run.Status}");
        Console.WriteLine($"run-summary.json written to {summaryPath}");
        Console.WriteLine();
        Console.WriteLine("Tasks:");

        foreach (ArchLucidApiClient.AgentTaskInfo task in resp.Tasks)
        {
            Console.WriteLine($"  - {task.AgentType}: {task.Objective}");
        }

        Console.WriteLine();
        Console.WriteLine(
            $"Next: Submit agent results, then commit. Use 'archlucid status {resp.Run.RunId}' to check progress.");

        return CliExitCode.Success;
    }
}
