using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli;

/// <summary>
///     Top-level CLI command handlers extracted from <see cref="Program" /> dispatch.
/// </summary>
internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandleNew(string[] normalized)
    {
        if (normalized.Skip(1).Any(static a =>
                string.Equals(a, "--quickstart", StringComparison.OrdinalIgnoreCase)))
        {
            const string quickstartMessage =
                "--quickstart is not supported. Use archlucid new <name> and set apiUrl in archlucid.json or ARCHLUCID_API_URL.";

            if (CliExecutionContext.JsonOutput)
                CliJson.WriteFailureLine(
                    Console.Error,
                    CliExitCode.UsageError,
                    "usage",
                    quickstartMessage);
            else
                Console.WriteLine(quickstartMessage);

            return CliExitCode.UsageError;
        }

        if (TryParseNewCommandArgs(normalized.Skip(1).ToArray(), out string? projectName))
            return await NewCommand.RunAsync(projectName);

        WriteNewUsage();

        return CliExitCode.UsageError;
    }

}
