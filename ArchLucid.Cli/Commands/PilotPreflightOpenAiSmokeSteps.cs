using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Optional Azure OpenAI reachability smoke for guided pilot init (Real mode, non-Echo).
/// </summary>
internal static class PilotPreflightOpenAiSmokeSteps
{
    internal static PilotPreflightStepResult Evaluate(
        IConfiguration configuration,
        Func<Uri, CancellationToken, Task<bool>>? tcpReachabilityProbe = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(configuration))
        {
            string mode = configuration["AgentExecution:Mode"]?.Trim() ?? "Simulator";

            return new PilotPreflightStepResult
            {
                Name = "azure-openai-smoke",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = $"skipped ({mode} — smoke runs only for AgentExecution:Mode=Real without Echo client)",
            };
        }

        HostingMisconfigurationWarning? finding =
            AzureOpenAiEndpointConnectivityLintAdvisor.TryDescribeConnectivityFinding(
                configuration,
                tcpReachabilityProbe);

        cancellationToken.ThrowIfCancellationRequested();

        if (finding is not HostingMisconfigurationWarning warning)
        {
            return new PilotPreflightStepResult
            {
                Name = "azure-openai-smoke",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "Azure OpenAI endpoint TCP probe succeeded from this environment.",
            };
        }

        return new PilotPreflightStepResult
        {
            Name = "azure-openai-smoke",
            Disposition = PilotPreflightDisposition.Warn,
            Detail = warning.Message,
            Remediation =
                "Verify AzureOpenAI:Endpoint, DNS, private endpoints, and outbound firewall rules; rerun `archlucid pilot init`.",
        };
    }
}
