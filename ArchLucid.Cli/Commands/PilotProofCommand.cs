using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI wrapper around collect-first-pilot-proof.ps1.")]
internal static class PilotProofCommand
{
    public static async Task<int> RunAsync(string[] args)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        if (args.Length == 0 || args.Any(static a => a is "--help" or "-h" or "/?"))
        {
            await PrintUsageAsync();

            return args.Length == 0 ? CliExitCode.UsageError : CliExitCode.Success;
        }

        string scriptPath = Path.Combine("scripts", "collect-first-pilot-proof.ps1");

        if (!File.Exists(scriptPath))
        {
            await Console.Error.WriteLineAsync(
                $"[pilot proof] Could not find {scriptPath}. Run from the repository root.");

            return CliExitCode.UsageError;
        }

        List<string> psArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath];

        foreach (string arg in args)
        {
            psArgs.Add(arg);
        }

        ProcessStartInfo psi = new()
        {
            FileName = "pwsh",
            Arguments = string.Join(" ", psArgs.Select(QuoteArg)),
            UseShellExecute = false,
            CreateNoWindow = false,
        };

        using Process? process = Process.Start(psi);

        if (process is null)
        {
            await Console.Error.WriteLineAsync("[pilot proof] Failed to start pwsh.");

            return CliExitCode.UsageError;
        }

        await process.WaitForExitAsync();

        return process.ExitCode == 0 ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static async Task PrintUsageAsync()
    {
        await Console.Out.WriteLineAsync("archlucid pilot proof — collect first-pilot PASS/WARN/BLOCK evidence (read-only).");
        await Console.Out.WriteLineAsync();
        await Console.Out.WriteLineAsync("Usage:");
        await Console.Out.WriteLineAsync("  dotnet run --project ArchLucid.Cli -- pilot proof [script-args...]");
        await Console.Out.WriteLineAsync();
        await Console.Out.WriteLineAsync("Common script arguments (forwarded to scripts/collect-first-pilot-proof.ps1):");
        await Console.Out.WriteLineAsync("  -ProofDirectory <path>     Output folder (default: artifacts/first-pilot-proof)");
        await Console.Out.WriteLineAsync("  -RunId <guid>               Committed review run for evidence + trace chain");
        await Console.Out.WriteLineAsync("  -StagingSmokeResultsPath    Attach measured staging-smoke timings");
        await Console.Out.WriteLineAsync("  -ProductionLikeHostedPilot  Stricter hosted sponsor gates");
        await Console.Out.WriteLineAsync("  -SponsorHandoff             Include sponsor-handoff rows in summary");
        await Console.Out.WriteLineAsync();
        await Console.Out.WriteLineAsync("Environment:");
        await Console.Out.WriteLineAsync("  ARCHLUCID_INTEGRATION_DRILL_API_URL  Optional integration correctness drill");
        await Console.Out.WriteLineAsync();
        await Console.Out.WriteLineAsync("Primary outputs: first-pilot-command-center.md, go-no-go-summary.md");
        await Console.Out.WriteLineAsync("Docs: docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md");
    }

    private static string QuoteArg(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "\"\"";

        if (!value.Contains(' ') && !value.Contains('"'))
            return value;

        return "\"" + value.Replace("\"", "\\\"", StringComparison.Ordinal) + "\"";
    }
}
