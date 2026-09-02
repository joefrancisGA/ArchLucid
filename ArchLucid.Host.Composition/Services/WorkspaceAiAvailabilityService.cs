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
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Composition.Services.Probes;

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

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly WorkspaceAiCustomerConnectionProbe _customerConnectionProbe =
        new(azureOpenAiConnectionRepository, secretProvider, llmBudgetStatusService);

    private readonly WorkspaceAiManagedPlatformProbe _managedPlatformProbe =
        new(configuration, llmBudgetStatusService, serviceProvider, completionClientLogger);

    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

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
            return await _customerConnectionProbe
                .ProbeAsync(scope, checks, debug, asOfUtc, probeBudget.Token)
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

            WorkspaceAiCircuitBreakerProbe.AppendChecks(_serviceProvider, checks, debug);

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

            return WorkspaceAiAvailabilityProbeResponses.Unavailable(
                "managed-platform",
                AgentExecutionReadinessMessages.LiveCompletionUnavailable,
                checks,
                debug,
                asOfUtc);
        }

        return await _managedPlatformProbe.ProbeAsync(checks, debug, asOfUtc, probeBudget.Token).ConfigureAwait(false);
    }
}
