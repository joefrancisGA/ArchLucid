using System.Globalization;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Composition.Services.Probes;
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
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
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

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

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

        string configuredMode = (_configuration["AgentExecution:Mode"] ?? "Simulator").Trim();
        string effectiveMode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode();
        string completionClient = (_configuration["AgentExecution:CompletionClient"] ?? string.Empty).Trim();

        debug["configuredAgentExecutionMode"] = configuredMode;
        debug["effectiveAgentExecutionMode"] = effectiveMode;
        debug["agentExecutionMode"] = effectiveMode;
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

        if (string.Equals(effectiveMode, DevAgentExecutionModeHeaderNames.Simulator, StringComparison.OrdinalIgnoreCase))
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

        if (!AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(_configuration))
        {
            checks.Add(WorkspaceAiConnectionProbe.BuildManagedConfigurationCheckRow(configured: false));

            return Unavailable(
                "managed-platform",
                AgentExecutionReadinessMessages.LiveCompletionUnavailable,
                checks,
                debug,
                asOfUtc);
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
            checks.Add(WorkspaceAiConnectionProbe.BuildMissingRecordCheckRow());

            return Unavailable(
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

            return Unavailable(
                "customer-connection",
                "Your workspace customer-provided AI connection is disabled — reviews cannot start until it is enabled.",
                checks,
                debug,
                asOfUtc);
        }

        LlmMonthlyTenantDollarBudgetStatusResult customerBudgetStatus = await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);
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

        WorkspaceAiLiveCompletionCheckProbe.AppendProbeMetadata(debug, liveProbe);
        checks.Add(WorkspaceAiConnectionProbe.BuildCustomerLiveProbeCheckRow(liveProbe));

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

        checks.Add(WorkspaceAiConnectionProbe.BuildManagedConfigurationCheckRow(configured));

        LlmMonthlyTenantDollarBudgetStatusResult budgetStatus = await _llmBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);

        WorkspaceAiBudgetProbe.AppendDebugMetadata(debug, budgetStatus);
        checks.Add(WorkspaceAiBudgetProbe.BuildCheckRow(budgetStatus));

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
                WorkspaceAiLiveCompletionCheckProbe.AppendProbeMetadata(debug, liveProbe);
            }
        }

        checks.Add(WorkspaceAiConnectionProbe.BuildManagedLiveProbeCheckRow(configured, completionSucceeded, completionDetail));

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
