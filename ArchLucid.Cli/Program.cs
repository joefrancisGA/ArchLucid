using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli;

[ExcludeFromCodeCoverage(Justification = "CLI dispatch and console I/O; tested via CLI integration tests.")]
public static class Program
{
    private static async Task<int> Main(string[] args) => await RunAsync(args);

    /// <summary>
    ///     Entry point for the CLI. Used by tests to assert exit codes and behavior.
    /// </summary>
    public static async Task<int> RunAsync(string[] args)
    {
        string[] normalized = CliExecutionContext.StripLeadingGlobalJsonFlags(args, out bool json);
        CliExecutionContext.JsonOutput = json;

        try
        {
            if (normalized.Length == 0 || IsRootHelpRequest(normalized))
            {
                CommandRegistry.Default.WriteRootHelp();

                return CliExitCode.UsageError;
            }

            return await CommandRegistry.Default.DispatchAsync(normalized);
        }
        finally
        {
            CliExecutionContext.JsonOutput = false;
        }
    }

    private static bool IsRootHelpRequest(string[] normalized)
    {
        if (normalized.Length != 1)
            return false;

        string token = normalized[0];

        return string.Equals(token, "--help", StringComparison.Ordinal)
               || string.Equals(token, "-h", StringComparison.Ordinal)
               || string.Equals(token, "-?", StringComparison.Ordinal);
    }
}
