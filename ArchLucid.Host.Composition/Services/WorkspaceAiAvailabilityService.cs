using System.Globalization;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Core.Resilience;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Services;

/// <summary>
///     Live workspace AI availability probes for review failure recovery (non-secret diagnostics only).
/// </summary>
public sealed class WorkspaceAiAvailabilityService(
    IConfiguration configuration,
    IScopeContextProvider scopeContextProvider,
    ITenantAiBudgetPolicyResolver aiBudgetPolicyResolver,
    ITenantAzureOpenAiConnectionRepository azureOpenAiConnectionRepository,
    ISecretProvider secretProvider,
    ILlmMonthlyTenantDollarBudgetStatusService llmBudgetStatusService,
    IServiceProvider serviceProvider,
    ILogger<AzureOpenAiCompletionClient> completionClientLogger,
    TimeProvider timeProvider) : IWorkspaceAiAvailabilityService
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantAiBudgetPolicyResolver _aiBudgetPolicyResolver =
        aiBudgetPolicyResolver ?? throw new ArgumentNullException(nameof(aiBudgetPolicyResolver));

    private readonly ITenantAzureOpenAiConnectionRepository _azureOpenAiConnectionRepository =
        azureOpenAiConnectionRepository ?? throw new ArgumentNullException(nameof(azureOpenAiConnectionRepository));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly ILlmMonthlyTenantDollarBudgetStatusService _llmBudgetStatusService =
        llmBudgetStatusService ?? throw new ArgumentNullException(nameof(llmBudgetStatusService));

    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<AzureOpenAiCompletionClient> _completionClientLogger =
        completionClientLogger ?? throw new ArgumentNullException(nameof(completionClientLogger));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<WorkspaceAiAvailabilityResponse> ProbeAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using CancellationTokenSource probeBudget = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        probeBudget.CancelAfter(WorkspaceAiAvailabilityProbeLimits.TotalProbeTimeout);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime asOfUtc = _timeProvider.GetUtcNow().UtcDateTime;

        List<WorkspaceAiAvailabilityCheckRow> checks = [];
        Dictionary<string, string> debug = new(StringComparer.Ordinal);

        string agentMode = (_configuration["AgentExecution:Mode"] ?? "Simulator").Trim();
        string completionClient = (_configuration["AgentExecution:CompletionClient"] ?? string.Empty).Trim();

        debug["agentExecutionMode"] = agentMode;
        debug["completionClient"] = string.IsNullOrWhiteSpace(completionClient) ? "(default)" : completionClient;
        debug["tenantId"] = scope.TenantId.ToString("D");
        debug["workspaceId"] = scope.WorkspaceId.ToString("D");
        debug["probeBudgetSeconds"] =
            WorkspaceAiAvailabilityProbeLimits.TotalProbeTimeout.TotalSeconds.ToString(CultureInfo.InvariantCulture);

        TenantAiBudgetPolicySnapshot policy =
            await _aiBudgetPolicyResolver.ResolveAsync(scope.TenantId, probeBudget.Token).ConfigureAwait(false);

        debug["workspaceKind"] = policy.WorkspaceKind.ToString();
        debug["customerAiProviderConfigured"] = policy.CustomerAiProviderConfigured.ToString();

        if (policy.CustomerAiProviderConfigured)
        {
            return await ProbeCustomerConnectionAsync(scope, checks, debug, asOfUtc, probeBudget.Token)
                .ConfigureAwait(false);
        }

        if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "agent_execution_mode",
                    Status = "ok",
                    Detail = "Agent execution is in Simulator mode — reviews use simulated completions, not live Azure OpenAI.",
                });

            AppendCircuitBreakerChecks(checks, debug);

            return new WorkspaceAiAvailabilityResponse
            {
                IsAvailable = true,
                Validated = true,
                AiSource = "simulator",
                Summary =
                    "Simulator mode is active — platform-managed Azure OpenAI is not required for review execution.",
                AsOfUtc = asOfUtc,
                Checks = checks,
                Debug = debug,
            };
        }

        return await ProbeManagedPlatformAsync(checks, debug, asOfUtc, probeBudget.Token).ConfigureAwait(false);
    }

    private async Task<WorkspaceAiAvailabilityResponse> ProbeCustomerConnectionAsync(
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
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "customer_connection_record",
                    Status = "failed",
                    Detail = "Customer-provided AI connection policy is enabled but no connection row exists.",
                });

            return Unavailable(
                "customer-connection",
                "Customer-provided AI connection is not configured for this workspace.",
                checks,
                debug,
                asOfUtc);
        }

        debug["customerConnectionEnabled"] = row.IsEnabled.ToString();

        if (!string.IsNullOrWhiteSpace(row.Endpoint))
        {
            debug["customerConnectionEndpointHost"] = TryHost(row.Endpoint);
        }

        if (!row.IsEnabled)
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "customer_connection_record",
                    Status = "failed",
                    Detail = "Customer-provided AI connection exists but is disabled.",
                });

            return Unavailable(
                "customer-connection",
                "Your workspace customer-provided AI connection is disabled — reviews cannot start until it is enabled.",
                checks,
                debug,
                asOfUtc);
        }

        AppendBudgetCheck(checks, debug, await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false));

        WorkspaceAiLiveCompletionProbeResult liveProbe;

        try
        {
            (AzureOpenAiCompletionClient Client, string DeploymentName)? customerClient = await WorkspaceAiLiveCompletionProbe
                .TryCreateCustomerConnectionClientAsync(row, _secretProvider, cancellationToken)
                .ConfigureAwait(false);

            if (customerClient is null)
            {
                checks.Add(
                    new WorkspaceAiAvailabilityCheckRow
                    {
                        Name = "customer_connection_live_probe",
                        Status = "failed",
                        Detail = "API key secret is missing or empty.",
                    });

                return Unavailable(
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

        AppendLiveProbeMetadata(debug, liveProbe);

        checks.Add(
            new WorkspaceAiAvailabilityCheckRow
            {
                Name = "customer_connection_live_probe",
                Status = liveProbe.Succeeded ? "ok" : "failed",
                Detail = liveProbe.Detail,
            });

        if (!liveProbe.Succeeded)
        {
            return Unavailable(
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

    private async Task<WorkspaceAiAvailabilityResponse> ProbeManagedPlatformAsync(
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
            debug["azureOpenAiEndpointHost"] = TryHost(endpoint);
        }

        if (!string.IsNullOrWhiteSpace(deployment))
        {
            debug["azureOpenAiDeploymentName"] = deployment;
        }

        bool configured = AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(_configuration);

        checks.Add(
            new WorkspaceAiAvailabilityCheckRow
            {
                Name = "azure_openai_configuration",
                Status = configured ? "ok" : "failed",
                Detail = configured
                    ? "Azure OpenAI endpoint and deployment are configured for Real agent execution."
                    : "Azure OpenAI endpoint, deployment, or credentials are missing for Real agent execution.",
            });

        LlmMonthlyTenantDollarBudgetStatusResult budgetStatus =
            await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);

        AppendBudgetCheck(checks, debug, budgetStatus);

        bool circuitHealthy = AppendCircuitBreakerChecks(checks, debug);

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
                AppendLiveProbeMetadata(debug, liveProbe);
            }
        }

        checks.Add(
            new WorkspaceAiAvailabilityCheckRow
            {
                Name = "azure_openai_live_completion_probe",
                Status = !configured ? "skipped" : completionSucceeded ? "ok" : "failed",
                Detail = completionDetail,
            });

        bool budgetBlocking = budgetStatus.BlocksAdditionalLlmExecution;
        bool isAvailable = configured && completionSucceeded && circuitHealthy && !budgetBlocking;

        if (!isAvailable)
        {
            return Unavailable(
                "managed-platform",
                "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
                checks,
                debug,
                asOfUtc);
        }

        string modelSuffix = debug.TryGetValue("probeModelId", out string? modelId) && !string.IsNullOrWhiteSpace(modelId)
            ? $" (model {modelId})"
            : string.Empty;

        return new WorkspaceAiAvailabilityResponse
        {
            IsAvailable = true,
            Validated = true,
            AiSource = "managed-platform",
            Summary = $"ArchLucid-managed Azure OpenAI live probe succeeded for deployment '{deployment}'{modelSuffix}.",
            AsOfUtc = asOfUtc,
            Checks = checks,
            Debug = debug,
        };
    }

    private static void AppendLiveProbeMetadata(Dictionary<string, string> debug, WorkspaceAiLiveCompletionProbeResult liveProbe)
    {
        if (!string.IsNullOrWhiteSpace(liveProbe.DeploymentName))
        {
            debug["probeDeploymentName"] = liveProbe.DeploymentName;
        }

        if (!string.IsNullOrWhiteSpace(liveProbe.ModelId))
        {
            debug["probeModelId"] = liveProbe.ModelId;
        }
    }

    private static void AppendBudgetCheck(
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        LlmMonthlyTenantDollarBudgetStatusResult budgetStatus)
    {
        debug["monthlyBudgetMonitoringActive"] = budgetStatus.MonthlyBudgetMonitoringActive.ToString();
        debug["blocksAdditionalLlmExecution"] = budgetStatus.BlocksAdditionalLlmExecution.ToString();

        if (!string.IsNullOrWhiteSpace(budgetStatus.UtcMonth))
        {
            debug["llmBudgetUtcMonth"] = budgetStatus.UtcMonth;
        }

        if (budgetStatus.HardCapUtilizationFraction is not null)
        {
            debug["llmBudgetUtilizationFraction"] =
                budgetStatus.HardCapUtilizationFraction.Value.ToString(CultureInfo.InvariantCulture);
        }

        checks.Add(
            new WorkspaceAiAvailabilityCheckRow
            {
                Name = "workspace_llm_budget",
                Status = budgetStatus.BlocksAdditionalLlmExecution ? "failed" : "ok",
                Detail = budgetStatus.BlocksAdditionalLlmExecution
                    ? "Workspace AI spend cap is exhausted for the current UTC month."
                    : budgetStatus.MonthlyBudgetMonitoringActive
                        ? "Workspace AI spend is within the configured monthly cap."
                        : "Monthly LLM dollar budget monitoring is not active for this workspace.",
            });
    }

    private bool AppendCircuitBreakerChecks(List<WorkspaceAiAvailabilityCheckRow> checks, Dictionary<string, string> debug)
    {
        string[] gateKeys =
        [
            OpenAiCircuitBreakerKeys.Completion,
            OpenAiCircuitBreakerKeys.CompletionFallback,
            OpenAiCircuitBreakerKeys.Embedding,
        ];

        bool allClosed = true;

        foreach (string gateKey in gateKeys)
        {
            CircuitBreakerGate? gate = _serviceProvider.GetKeyedService<CircuitBreakerGate>(gateKey);

            if (gate is null)
            {
                continue;
            }

            string role = OpenAiCircuitBreakerHealthMetadata.ResolveRole(gateKey);
            debug[$"circuitBreaker.{role}.state"] = gate.CurrentState;
            debug[$"circuitBreaker.{role}.consecutiveFailures"] =
                gate.ConsecutiveFailureCount.ToString(CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(gate.LastOpenReason))
            {
                debug[$"circuitBreaker.{role}.lastOpenReason"] = gate.LastOpenReason;
            }

            bool degraded = gate.CurrentState is "Open" or "HalfOpen";

            if (degraded)
            {
                allClosed = false;
            }

            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = $"circuit_breaker_{role}",
                    Status = degraded ? "degraded" : "ok",
                    Detail = degraded
                        ? $"Circuit '{role}' is {gate.CurrentState}."
                        : $"Circuit '{role}' is closed.",
                });
        }

        if (checks.All(row => !row.Name.StartsWith("circuit_breaker_", StringComparison.Ordinal)))
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "circuit_breakers",
                    Status = "skipped",
                    Detail = "OpenAI circuit breakers are not registered on this host.",
                });
        }

        return allClosed;
    }

    private static WorkspaceAiAvailabilityResponse Unavailable(
        string aiSource,
        string summary,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        DateTime asOfUtc) =>
        new()
        {
            IsAvailable = false,
            Validated = true,
            AiSource = aiSource,
            Summary = summary,
            AsOfUtc = asOfUtc,
            Checks = checks,
            Debug = debug,
        };

    private static string TryHost(string endpoint)
    {
        if (!Uri.TryCreate(endpoint.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return "(invalid-uri)";
        }

        return uri.Host;
    }
}
