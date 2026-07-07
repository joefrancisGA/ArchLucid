using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Stack;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "Thin console wrapper over ArchlucidStackDiffOrchestrator.")]
internal static class StackDiffCommand
{
    internal static Task<int> RunAsync(string[] args)
    {
        if (!StackDiffOptions.TryParse(args, out StackDiffOptions? options, out string? parseError))
        {
            if (!string.IsNullOrEmpty(parseError))
                Console.Error.WriteLine(parseError);

            WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        ArgumentNullException.ThrowIfNull(options);

        ArchlucidStackDiffOrchestrator.Result result = ArchlucidStackDiffOrchestrator.Run(options);

        foreach (string message in result.Messages)
            Console.WriteLine(message);

        return Task.FromResult(result.ExitCode);
    }

    private static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid stack diff [--answers <path>] [--out <dir>] [--repo-root <dir>]");
    }
}
