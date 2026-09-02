using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Composition.Services.Probes;

namespace ArchLucid.Host.Composition.Services.Probes;

internal sealed class WorkspaceAiCustomerConnectionProbe(
    ITenantAzureOpenAiConnectionRepository azureOpenAiConnectionRepository,
    ISecretProvider secretProvider,
    ILlmMonthlyTenantDollarBudgetStatusService llmBudgetStatusService)
{
    private readonly ITenantAzureOpenAiConnectionRepository _azureOpenAiConnectionRepository =
        azureOpenAiConnectionRepository ?? throw new ArgumentNullException(nameof(azureOpenAiConnectionRepository));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly ILlmMonthlyTenantDollarBudgetStatusService _llmBudgetStatusService =
        llmBudgetStatusService ?? throw new ArgumentNullException(nameof(llmBudgetStatusService));

    internal async Task<WorkspaceAiAvailabilityResponse> ProbeAsync(
        ScopeContext scope,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        DateTime asOfUtc,
        CancellationToken cancellationToken)
    {
        TenantAzureOpenAiConnectionRecord? row =
            await _azureOpenAiConnectionRepository.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (row is null)
        {
            checks.Add(WorkspaceAiConnectionProbe.BuildMissingRecordCheckRow());

            return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                "customer-connection",
                "Customer-provided AI connection is not configured for this workspace.",
                checks,
                debug,
                asOfUtc);
        }

        WorkspaceAiConnectionProbe.AppendConnectionDebugMetadata(debug, row);

        if (!row.IsEnabled)
        {
            checks.Add(WorkspaceAiConnectionProbe.BuildDisabledRecordCheckRow());

            return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                "customer-connection",
                "Your workspace customer-provided AI connection is disabled — reviews cannot start until it is enabled.",
                checks,
                debug,
                asOfUtc);
        }

        LlmMonthlyTenantDollarBudgetStatusResult customerBudgetStatus =
            await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);
        WorkspaceAiBudgetProbe.AppendDebugMetadata(debug, customerBudgetStatus);
        checks.Add(WorkspaceAiBudgetProbe.BuildCheckRow(customerBudgetStatus));

        WorkspaceAiLiveCompletionProbeResult liveProbe;

        try
        {
            (AzureOpenAiCompletionClient Client, string DeploymentName)? customerClient = await WorkspaceAiLiveCompletionProbe
                .TryCreateCustomerConnectionClientAsync(row, _secretProvider, cancellationToken)
                .ConfigureAwait(false);

            if (customerClient is null)
            {
                checks.Add(WorkspaceAiConnectionProbe.BuildMissingApiKeyCheckRow());

                return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                    "customer-connection",
                    "Your workspace customer-provided AI connection is unavailable — API key secret is missing.",
                    checks,
                    debug,
                    asOfUtc);
            }

            debug["probeDeploymentName"] = customerClient.Value.DeploymentName;

            using (customerClient.Value.Client)
            {
                liveProbe = await WorkspaceAiLiveCompletionProbe
                    .RunAsync(customerClient.Value.Client, customerClient.Value.DeploymentName, cancellationToken)
                    .ConfigureAwait(false);
            }
        }
        catch (InvalidOperationException ex)
        {
            liveProbe = WorkspaceAiLiveCompletionProbeResult.Failed("(unknown)", AzureOpenAiVendorProbeErrorFormatter.Format(ex));
        }

        WorkspaceAiLiveCompletionCheckProbe.AppendProbeMetadata(debug, liveProbe);
        checks.Add(WorkspaceAiConnectionProbe.BuildCustomerLiveProbeCheckRow(liveProbe));

        if (!liveProbe.Succeeded)
        {
            return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                "customer-connection",
                "Your workspace customer-provided AI connection is unavailable — reviews cannot start until the connection is restored.",
                checks,
                debug,
                asOfUtc);
        }

        return new WorkspaceAiAvailabilityResponse
        {
            IsAvailable = true,
            Validated = true,
            AiSource = "customer-connection",
            Summary = $"Customer-provided AI connection probe succeeded for deployment '{liveProbe.DeploymentName}'.",
            AsOfUtc = asOfUtc,
            Checks = checks,
            Debug = debug,
        };
    }
}
