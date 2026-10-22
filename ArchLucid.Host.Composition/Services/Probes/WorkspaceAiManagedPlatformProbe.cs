using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Services.Probes;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Services.Probes;

internal sealed class WorkspaceAiManagedPlatformProbe(
    IConfiguration configuration,
    ILlmMonthlyTenantDollarBudgetStatusService llmBudgetStatusService,
    IServiceProvider serviceProvider,
    ILogger<AzureOpenAiCompletionClient> completionClientLogger)
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILlmMonthlyTenantDollarBudgetStatusService _llmBudgetStatusService =
        llmBudgetStatusService ?? throw new ArgumentNullException(nameof(llmBudgetStatusService));

    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<AzureOpenAiCompletionClient> _completionClientLogger =
        completionClientLogger ?? throw new ArgumentNullException(nameof(completionClientLogger));

    internal async Task<WorkspaceAiAvailabilityResponse> ProbeAsync(
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        DateTime asOfUtc,
        CancellationToken cancellationToken)
    {
        bool usesManagedIdentity = AzureOpenAiConfigurationProbe.UsesManagedIdentity(_configuration);
        debug["azureOpenAiAuthenticationMode"] = usesManagedIdentity ? "ManagedIdentity" : "ApiKey";

        string? endpoint = _configuration[$"{AzureOpenAiOptions.SectionName}:Endpoint"]?.Trim();
        string? deployment = _configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"]?.Trim();

        if (!string.IsNullOrWhiteSpace(endpoint))
        {
            debug["azureOpenAiEndpointHost"] = WorkspaceAiAvailabilityProbeResponses.TryHost(endpoint);
        }

        if (!string.IsNullOrWhiteSpace(deployment))
        {
            debug["azureOpenAiDeploymentName"] = deployment;
        }

        bool configured = AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(_configuration);

        checks.Add(WorkspaceAiConnectionProbe.BuildManagedConfigurationCheckRow(configured));

        LlmMonthlyTenantDollarBudgetStatusResult budgetStatus =
            await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);

        WorkspaceAiBudgetProbe.AppendDebugMetadata(debug, budgetStatus);
        checks.Add(WorkspaceAiBudgetProbe.BuildCheckRow(budgetStatus));

        bool circuitHealthy = WorkspaceAiCircuitBreakerProbe.AppendChecks(_serviceProvider, checks, debug);

        bool completionSucceeded = false;
        string completionDetail = "Skipped because Azure OpenAI endpoint is not configured.";

        if (configured && !string.IsNullOrWhiteSpace(deployment))
        {
            debug["probeDeploymentName"] = deployment;

            using AzureOpenAiCompletionClient? client = WorkspaceAiLiveCompletionProbe.TryCreateManagedPlatformClient(
                _configuration,
                _completionClientLogger);

            if (client is null)
            {
                completionDetail = "Azure OpenAI client could not be created from configuration.";
            }
            else
            {
                WorkspaceAiLiveCompletionProbeResult liveProbe = await WorkspaceAiLiveCompletionProbe
                    .RunAsync(client, deployment, cancellationToken)
                    .ConfigureAwait(false);

                completionSucceeded = liveProbe.Succeeded;
                completionDetail = liveProbe.Detail;
                WorkspaceAiLiveCompletionCheckProbe.AppendProbeMetadata(debug, liveProbe);
            }
        }

        checks.Add(WorkspaceAiConnectionProbe.BuildManagedLiveProbeCheckRow(configured, completionSucceeded, completionDetail));

        bool usedFallback = false;

        if (!completionSucceeded)
        {
            usedFallback = await WorkspaceAiFallbackLiveCompletionProbe
                .TryProbeAfterPrimaryFailureAsync(
                    _configuration,
                    _completionClientLogger,
                    checks,
                    debug,
                    cancellationToken)
                .ConfigureAwait(false);

            if (usedFallback)
                completionSucceeded = true;
        }
        else
        {
            debug["fallbackLlmEnabled"] =
                (_configuration[$"{FallbackLlmOptions.SectionName}:Enabled"] ?? "false");
        }

        bool budgetBlocking = budgetStatus.BlocksAdditionalLlmExecution;
        bool isAvailable = configured && completionSucceeded && circuitHealthy && !budgetBlocking;

        if (!isAvailable)
        {
            return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                "managed-platform",
                "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
                checks,
                debug,
                asOfUtc);
        }

        string modelSuffix = debug.TryGetValue("probeModelId", out string? modelId) && !string.IsNullOrWhiteSpace(modelId)
            ? $" (model {modelId})"
            : string.Empty;

        string probedDeployment = usedFallback && debug.TryGetValue("fallbackProbeDeploymentName", out string? fallbackDep)
            ? fallbackDep
            : deployment ?? string.Empty;

        string summary = usedFallback
            ? $"ArchLucid-managed Azure OpenAI live probe succeeded on fallback deployment '{probedDeployment}'{modelSuffix} because the primary deployment was unavailable."
            : $"ArchLucid-managed Azure OpenAI live probe succeeded for deployment '{probedDeployment}'{modelSuffix}.";

        return new WorkspaceAiAvailabilityResponse
        {
            IsAvailable = true,
            Validated = true,
            AiSource = "managed-platform",
            Summary = summary,
            AsOfUtc = asOfUtc,
            Checks = checks,
            Debug = debug,
        };
    }
}
