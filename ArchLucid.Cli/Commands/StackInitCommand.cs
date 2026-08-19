using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Stack;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "Thin console wrapper over ArchlucidStackInitOrchestrator.")]
internal static class StackInitCommand
{
    internal static Task<int> RunAsync(string[] args)
    {
        if (!StackInitOptions.TryParse(args, out StackInitOptions? options, out string? parseError))
        {
            if (!string.IsNullOrEmpty(parseError))
                Console.Error.WriteLine(parseError);

            WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        ArgumentNullException.ThrowIfNull(options);

        ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

        foreach (string message in result.Messages)
            Console.WriteLine(message);

        return Task.FromResult(result.ExitCode);
    }

    private static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid stack init [--from-example] [--answers <path>] [--out <dir>] [--force] [--repo-root <dir>]");
    }
}
