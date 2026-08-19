using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid pack export-scaffold</c> — writes a starter policy-pack directory for customer-authored packs.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin filesystem orchestration; covered by PackExportScaffoldCommandTests.")]
internal static class PackExportScaffoldCommand
{
    public static Task<int> RunAsync(string[] args)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string outputPath = "./policy-pack-scaffold";
        bool force = false;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--output", StringComparison.Ordinal)
                || string.Equals(token, "-o", StringComparison.Ordinal))
            {
                if (i + 1 >= args.Length)
                {
                    WriteErr(CliExitCode.UsageError, "Missing value for --output.");

                    return Task.FromResult(CliExitCode.UsageError);
                }

                outputPath = args[++i].Trim();

                continue;
            }

            if (string.Equals(token, "--force", StringComparison.Ordinal))
            {
                force = true;

                continue;
            }

            WriteErr(CliExitCode.UsageError, $"Unexpected argument: {token}");

            return Task.FromResult(CliExitCode.UsageError);
        }

        if (string.IsNullOrWhiteSpace(outputPath))
        {
            WriteErr(CliExitCode.UsageError, "Output path must not be empty.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        string fullOutput = Path.GetFullPath(outputPath);

        if (Directory.Exists(fullOutput))
        {
            string[] existing = Directory.GetFiles(fullOutput, "*", SearchOption.TopDirectoryOnly);

            if (existing.Length > 0 && !force)
            {
                WriteErr(
                    CliExitCode.OperationFailed,
                    $"Directory is not empty: {fullOutput}. Pass --force to overwrite scaffold files.");

                return Task.FromResult(CliExitCode.OperationFailed);
            }
        }

        IReadOnlyList<string> written;

        try
        {
            written = PackExportScaffoldWriter.Write(fullOutput);
        }
        catch (Exception ex)
        {
            WriteErr(CliExitCode.OperationFailed, $"Could not write scaffold: {ex.Message}");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteSuccessLine(
                Console.Out,
                new
                {
                    ok = true,
                    outputDirectory = fullOutput,
                    files = written.Select(static p => Path.GetFileName(p)).ToArray()
                });

            return Task.FromResult(CliExitCode.Success);
        }

        Console.WriteLine($"Wrote policy pack scaffold to {fullOutput}:");

        foreach (string path in written)
            Console.WriteLine($"  {Path.GetFileName(path)}");

        return Task.FromResult(CliExitCode.Success);
    }

    private static void WriteErr(int exitCode, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, exitCode, "pack_export_scaffold", message);
        else
            Console.Error.WriteLine($"[pack export-scaffold] {message}");
    }
}
