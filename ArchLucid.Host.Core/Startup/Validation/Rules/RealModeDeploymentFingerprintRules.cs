using ArchLucid.Contracts.Agents;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.Hosting;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
///     When <c>AgentExecution:Mode=Real</c> on Production- or Staging-like hosts, rejects blank
///     <c>AzureOpenAI:DeploymentName</c> and values that mirror <see cref="AgentExecutionTraceModelMetadata" /> sentinels so
///     persisted traces remain forensically meaningful (see <c>docs/library/AGENT_TRACE_FORENSICS.md</c>).
/// </summary>
/// <remarks>
///     <see cref="AgentExecutionRules" /> also requires Azure OpenAI to be configured for Real mode in every environment; this rule adds a Production/Staging fingerprint posture.
/// </remarks>
internal static class RealModeDeploymentFingerprintRules
{
    public static void Collect(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(errors);

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
            return;

        string? agentMode = configuration["AgentExecution:Mode"];


        if (!string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase))
            return;

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();


        if (string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase))
            return;

        string? deployment = configuration["AzureOpenAI:DeploymentName"]?.Trim();


        if (string.IsNullOrWhiteSpace(deployment))
        {
            errors.Add(
                "AzureOpenAI:DeploymentName is missing or blank while AgentExecution:Mode=Real on a Production or Staging host. "
                + "Set a real deployment name so execution traces record trustworthy model metadata (docs/library/AGENT_TRACE_FORENSICS.md).");

            return;
        }


        if (string.Equals(deployment, AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName, StringComparison.Ordinal) ||
            string.Equals(deployment, AgentExecutionTraceModelMetadata.SimulatorDeploymentName, StringComparison.Ordinal))
        {
            errors.Add(
                $"AzureOpenAI:DeploymentName must not use execution-trace sentinel values ({AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName} / {AgentExecutionTraceModelMetadata.SimulatorDeploymentName}). "
                + "Set the real Azure OpenAI deployment name when AgentExecution:Mode=Real on Production or Staging. See docs/library/AGENT_TRACE_FORENSICS.md.");

            return;
        }


        if (deployment.StartsWith(AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix, StringComparison.Ordinal))
        {
            errors.Add(
                $"AzureOpenAI:DeploymentName must not start with '{AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix}' "
                + "(reserved for trace metadata when a fallback completion client produces the response). "
                + "Use the primary deployment name configured in Azure OpenAI.");
        }
    }
}
