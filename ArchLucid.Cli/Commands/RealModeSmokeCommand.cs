using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Entry point for <c>archlucid real-mode smoke</c>. Exercises hosted staging with a minimal create → execute → poll
///     loop and optional real-mode token verification.
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "HTTP entry point; behavior is covered by RealModeSmokeRunnerTests + RealModeSmokeCommandOptionsTests.")]
internal static class RealModeSmokeCommand
{
    private static readonly JsonSerializerOptions JsonCamel = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public static async Task<int> RunAsync(string[] args)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        RealModeSmokeCommandOptions? options = RealModeSmokeCommandOptions.Parse(args, out string? error);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(error);
            WriteUsage();

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = string.IsNullOrWhiteSpace(options.ApiBaseUrl)
            ? CliCommandShared.GetBaseUrl(config)
            : options.ApiBaseUrl!.Trim().TrimEnd('/');

        using HttpClient http = new();
        http.BaseAddress = new Uri(baseUrl + "/");
        http.DefaultRequestHeaders.Add("Accept", "application/json");
        http.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds + 60);

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        RealModeSmokeRunner runner = new(http);
        RealModeSmokeReport report = await runner.RunAsync(options);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(JsonSerializer.Serialize(report, JsonCamel));

            return report.AllPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        if (options.OneLineOutput)
        {
            Console.WriteLine(RealModeSmokeOneLineSummaryFormatter.Format(report, baseUrl));

            return report.AllPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        Console.WriteLine($"archlucid real-mode smoke @ {baseUrl}");
        Console.WriteLine(new string('-', 60));

        foreach (RealModeSmokeStepResult step in report.Steps)
        {
            string verdict = step.Passed ? "PASS" : "FAIL";
            Console.WriteLine($"[{verdict}] {step.Name,-22} {step.Detail}");

            if (!step.Passed && !string.IsNullOrWhiteSpace(step.FailureHint))
                Console.WriteLine($"        hint: {step.FailureHint}");
        }

        Console.WriteLine(new string('-', 60));
        Console.WriteLine(report.AllPassed
            ? $"PASS — runId={report.RunId ?? "<none>"} status={report.FinalRunStatus ?? "<none>"} tokens={report.TotalLlmTokens} correlation={report.CorrelationId ?? "<none>"}"
            : "FAIL — see step output above. Re-run with --json for machine-readable output.");

        return report.AllPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid real-mode smoke [--staging] [--one-line] [--api-base-url <url>] " +
            "[--timeout-seconds <n>] [--poll-interval-seconds <n>] [--allow-simulator]");
    }
}
