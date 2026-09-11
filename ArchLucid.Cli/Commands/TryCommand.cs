using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid try</c> — door-aware wrapper around hosted <c>real-mode smoke</c> (AS-083). Default is Rehearsal;
///     Career requires explicit <c>--real</c> (and ADR 0033 local gate when not targeting a hosted API).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin delegate to RealModeSmokeCommand; covered by TryCommandOptionsTests.")]
internal static class TryCommand
{
    public static async Task<int> RunAsync(string[] args)
    {
        TryCommandOptions? options = TryCommandOptions.Parse(args, out string? error);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(error);
            TryCommandHelp.WriteHelp();

            return CliExitCode.UsageError;
        }

        if (options.ShowHelp)
        {
            TryCommandHelp.WriteHelp(options.Door);

            return CliExitCode.Success;
        }

        if (!options.HasForwardedSmokeArgs)
        {
            TryCommandHelp.WriteHelp(options.Door);

            return CliExitCode.Success;
        }

        if (options.Door == TryCommandExecutionDoor.Career
            && !options.IsHostedSmokeTarget
            && !options.IsPilotRealAzureOpenAiAttempt)
        {
            await Console.Error.WriteLineAsync(TryCommandHelp.CareerDoorRequiresRealAoaiGateMessage);
            TryCommandHelp.WriteHelp(TryCommandExecutionDoor.Career);

            return CliExitCode.UsageError;
        }

        string[] smokeArgs = BuildSmokeArgs(options);

        return await RealModeSmokeCommand.RunAsync(smokeArgs);
    }

    internal static string[] BuildSmokeArgs(TryCommandOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        List<string> smokeArgs = [];

        if (options.Door == TryCommandExecutionDoor.Rehearsal)
            smokeArgs.Add("--allow-simulator");

        smokeArgs.AddRange(options.ForwardedSmokeArgs);

        return smokeArgs.ToArray();
    }
}
