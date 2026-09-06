using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandleRun(string[] normalized)
    {
        if (normalized.Contains("--quick"))
        {
            const string quickRemoved =
                "run --quick is not supported. Use archlucid run without --quick against your hosted API.";

            if (CliExecutionContext.JsonOutput)
                CliJson.WriteFailureLine(
                    Console.Error,
                    CliExitCode.UsageError,
                    "usage",
                    quickRemoved);
            else
                Console.WriteLine(quickRemoved);

            return CliExitCode.UsageError;
        }

        string? idempotencyKey = CliCommandShared.TryGetOptionValue(normalized, "--idempotency-key");

        return await RunCommand.RunAsync(idempotencyKey);
    }


    internal static async Task<int> HandleStatus(string[] normalized)
    {
        if (normalized.Length > 1)
            return await StatusCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid status <runId>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleTrace(string[] normalized)
    {
        if (normalized.Length > 1)
            return await TraceCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid trace <runId>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleRunSupportPacket(string[] normalized)
    {
        if (normalized.Length > 1)
            return await RunSupportPacketCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid run-support-packet <runId>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSubmit(string[] normalized)
    {
        if (normalized.Length > 2)
            return await SubmitCommand.RunAsync(normalized[1], normalized[2]);

        Console.WriteLine("Usage: archlucid submit <runId> <result.json>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleCommit(string[] normalized)
    {
        if (normalized.Length > 1)
            return await CommitCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid commit <runId>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleArtifacts(string[] normalized)
    {
        if (normalized.Length <= 1)
        {
            Console.WriteLine("Usage: archlucid artifacts <runId> [--save]");

            return CliExitCode.UsageError;
        }

        bool saveArtifacts = normalized.Length > 2 && normalized[2] == "--save";

        return await ArtifactsCommand.RunAsync(normalized[1], saveArtifacts);
    }


    internal static Task<int> HandleComparisons(string[] normalized) =>
        ComparisonsCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleArchitectures(string[] normalized) =>
        ArchitecturesCommand.RunAsync(normalized.Skip(1).ToArray());


}
