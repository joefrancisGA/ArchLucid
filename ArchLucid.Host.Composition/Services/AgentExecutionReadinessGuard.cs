using ArchLucid.Application.AiProviders;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.Services;

/// <summary>
///     Fails fast when effective Real mode cannot reach live completions (mirrors
///     <see cref="ArchLucid.AgentRuntime.DevSwitchableAgentCompletionClient" /> routing).
/// </summary>
public sealed class AgentExecutionReadinessGuard(
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    IConfiguration configuration,
    IScopeContextProvider scopeContextProvider,
    ITenantAiBudgetPolicyResolver aiBudgetPolicyResolver) : IAgentExecutionReadinessGuard
{
    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantAiBudgetPolicyResolver _aiBudgetPolicyResolver =
        aiBudgetPolicyResolver ?? throw new ArgumentNullException(nameof(aiBudgetPolicyResolver));

    public async Task EnsureReadyForExecuteAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string effectiveMode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode();

        if (string.Equals(effectiveMode, DevAgentExecutionModeHeaderNames.Simulator, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantAiBudgetPolicySnapshot policy =
            await _aiBudgetPolicyResolver.ResolveAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (policy.CustomerAiProviderConfigured)
        {
            return;
        }

        if (AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(_configuration))
        {
            return;
        }

        throw new InvalidOperationException(AgentExecutionReadinessMessages.LiveCompletionUnavailable);
    }
}
