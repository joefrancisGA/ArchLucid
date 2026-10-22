using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Services.Probes;

/// <summary>Same-family FallbackLlm live completion probe used when the primary managed-platform probe fails.</summary>
internal static class WorkspaceAiFallbackLiveCompletionProbe
{
    internal static async Task<bool> TryProbeAfterPrimaryFailureAsync(
        IConfiguration configuration,
        ILogger<AzureOpenAiCompletionClient> completionClientLogger,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(completionClientLogger);
        ArgumentNullException.ThrowIfNull(checks);
        ArgumentNullException.ThrowIfNull(debug);

        string? enabledRaw = configuration[$"{FallbackLlmOptions.SectionName}:Enabled"];
        bool enabled = string.Equals(enabledRaw, "true", StringComparison.OrdinalIgnoreCase);

        FallbackLlmOptions fallbackOpts =
            configuration.GetSection(FallbackLlmOptions.SectionName).Get<FallbackLlmOptions>()
            ?? new FallbackLlmOptions();
        fallbackOpts.Enabled = enabled || fallbackOpts.Enabled;

        debug["fallbackLlmEnabled"] = fallbackOpts.Enabled.ToString();

        if (!fallbackOpts.Enabled)
            return false;

        IReadOnlyList<FallbackLlmResolvedEndpoint> endpoints;

        try
        {
            endpoints = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(fallbackOpts);
        }
        catch (InvalidOperationException ex)
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "azure_openai_fallback_live_completion_probe",
                    Status = "failed",
                    Detail = ex.Message,
                });

            return false;
        }

        if (endpoints.Count == 0)
            return false;

        FallbackLlmResolvedEndpoint first = endpoints[0];
        debug["fallbackProbeDeploymentName"] = first.DeploymentName;
        debug["fallbackProbeEndpointHost"] = WorkspaceAiAvailabilityProbeResponses.TryHost(first.Endpoint);
        debug["fallbackProbeUseManagedIdentity"] = first.UseManagedIdentity.ToString();

        using AzureOpenAiCompletionClient? client = WorkspaceAiLiveCompletionProbe.TryCreateFallbackClient(
            first,
            completionClientLogger);

        if (client is null)
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "azure_openai_fallback_live_completion_probe",
                    Status = "failed",
                    Detail = "Fallback Azure OpenAI client could not be created from configuration.",
                });

            return false;
        }

        WorkspaceAiLiveCompletionProbeResult liveProbe = await WorkspaceAiLiveCompletionProbe
            .RunAsync(client, first.DeploymentName, cancellationToken)
            .ConfigureAwait(false);

        checks.Add(
            new WorkspaceAiAvailabilityCheckRow
            {
                Name = "azure_openai_fallback_live_completion_probe",
                Status = liveProbe.Succeeded ? "ok" : "failed",
                Detail = liveProbe.Detail,
            });

        if (!liveProbe.Succeeded)
            return false;

        WorkspaceAiLiveCompletionCheckProbe.AppendProbeMetadata(debug, liveProbe);
        debug["probeUsedFallback"] = "true";

        return true;
    }
}
