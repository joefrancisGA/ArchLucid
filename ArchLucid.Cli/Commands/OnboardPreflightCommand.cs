using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Single production-like onboarding preflight: local config lint + pilot HTTP readiness (T2-2).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "CLI HTTP orchestration; covered by OnboardPreflightCommandTests.")]
internal static class OnboardPreflightCommand
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

        bool localLab = args.Contains("--local-lab", StringComparer.OrdinalIgnoreCase);
        bool simulateProduction = !localLab
                                  || args.Contains("--simulate-production", StringComparer.OrdinalIgnoreCase);

        IConfiguration localConfiguration = PilotPreflightLocalSteps.LoadLocalConfiguration(simulateProduction);
        List<PilotPreflightStepResult> steps =
        [
            .. EvaluateProductionLikeConfigLint(localConfiguration, simulateProduction),
            .. PilotPreflightLocalSteps.Evaluate(localConfiguration, simulateProduction),
        ];

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);
        PilotPreflightRunner runner = new(http);
        PilotPreflightReport report = await runner.RunAsync(baseUrl, steps, cancellationToken);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(PilotPreflightRunner.SerializeJson(report));

            return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        Console.WriteLine($"archlucid onboard-preflight @ {report.BaseUrl}");
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
            : $"BLOCK — {report.BlockCount} blocking failure(s), {report.WarnCount} warning(s). Fix BLOCK rows before production-like onboarding.");

        return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static IEnumerable<PilotPreflightStepResult> EvaluateProductionLikeConfigLint(
        IConfiguration localConfiguration,
        bool simulateProduction)
    {
        string envName =
            localConfiguration["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? (simulateProduction ? Environments.Production : Environments.Development);

        OperatorConfigurationLintSnapshot lintSnapshot =
            OperatorConfigurationLintEvaluator.Evaluate(localConfiguration, envName.Trim());

        ConfigLintReportDocument report =
            ConfigLintReportBuilder.Build(lintSnapshot, ConfigLintProfileNames.ProductionLikeHostedPilot);

        foreach (ConfigLintReportFinding finding in report.BlockingFindings)
        {
            yield return new PilotPreflightStepResult
            {
                Name = $"config-lint:{finding.Category}:{finding.RuleName}",
                Disposition = PilotPreflightDisposition.Block,
                Detail = finding.Message,
                Remediation = string.IsNullOrWhiteSpace(finding.RemediationHint)
                    ? ConfigLintFindingGuidance.TryResolve(finding.RuleName)?.RemediationHint
                    : finding.RemediationHint,
            };
        }

        foreach (ConfigLintReportFinding finding in report.AdvisoryFindings)
        {
            yield return new PilotPreflightStepResult
            {
                Name = $"config-lint:{finding.Category}:{finding.RuleName}",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = finding.Message,
                Remediation = null,
            };
        }
    }
}
