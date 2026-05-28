using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP orchestration; covered by PilotPreflightRunnerTests.")]
internal static class PilotPreflightCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        bool simulateProduction = args.Contains("--simulate-production", StringComparer.OrdinalIgnoreCase);

        var localConfiguration = PilotPreflightLocalSteps.LoadLocalConfiguration(simulateProduction);
        IReadOnlyList<PilotPreflightStepResult> localSteps =
            PilotPreflightLocalSteps.Evaluate(localConfiguration, simulateProduction);

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);
        PilotPreflightRunner runner = new(http);
        PilotPreflightReport report = await runner.RunAsync(baseUrl, localSteps, cancellationToken);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(PilotPreflightRunner.SerializeJson(report));

            return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        Console.WriteLine($"archlucid pilot preflight @ {report.BaseUrl}");
        Console.WriteLine(new string('-', 60));

        foreach (PilotPreflightStepResult step in report.Steps)
        {
            string label = step.Disposition switch
            {
                PilotPreflightDisposition.Pass => "PASS",
                PilotPreflightDisposition.Warn => "WARN",
                _ => "BLOCK",
            };

            Console.WriteLine($"[{label}] {step.Name,-28} {step.Detail}");

            if (!string.IsNullOrWhiteSpace(step.Remediation))
                Console.WriteLine($"        next: {step.Remediation}");
        }

        Console.WriteLine(new string('-', 60));
        Console.WriteLine(report.AllBlockingPassed
            ? $"PASS — {report.WarnCount} warning(s), 0 blocking failure(s). See docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md."
            : $"BLOCK — {report.BlockCount} blocking failure(s), {report.WarnCount} warning(s). Fix BLOCK rows before first value.");

        return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
    }
}
