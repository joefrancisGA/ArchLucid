using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Maps <c>config lint --profile production-like-hosted-pilot</c> findings to pilot preflight step rows.
/// </summary>
internal static class PilotPreflightProductionLikeConfigLintSteps
{
    internal static IEnumerable<PilotPreflightStepResult> Evaluate(
        IConfiguration localConfiguration,
        bool simulateProduction)
    {
        ArgumentNullException.ThrowIfNull(localConfiguration);

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
