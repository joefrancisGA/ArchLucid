using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class AiBudgetPreCallGuard(
    ITenantAiBudgetPolicyResolver policyResolver,
    IDemoAiPromptCache demoPromptCache,
    IAiUsageEventRepository usageEventRepository,
    IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions,
    TimeProvider timeProvider) : IAiBudgetPreCallGuard
{
    private readonly ITenantAiBudgetPolicyResolver _policyResolver =
        policyResolver ?? throw new ArgumentNullException(nameof(policyResolver));

    private readonly IDemoAiPromptCache _demoPromptCache =
        demoPromptCache ?? throw new ArgumentNullException(nameof(demoPromptCache));

    private readonly IAiUsageEventRepository _usageEventRepository =
        usageEventRepository ?? throw new ArgumentNullException(nameof(usageEventRepository));

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<AiBudgetPreCallGuardResult> EnsureAllowedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        string? systemPrompt,
        string? userPrompt,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default)
    {
        TenantAiBudgetPolicySnapshot policy =
            await _policyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (policy.CustomerAiProviderConfigured)
        {
            return new AiBudgetPreCallGuardResult();
        }

        if (policy.WorkspaceKind == AiUsageWorkspaceKind.PublicDemo)
        {
            AiUsageControlsOptions controls = _aiUsageOptions.CurrentValue;

            if (controls.PublicDemoFeatureDailyLimitUsd.TryGetValue(feature.ToString(), out decimal featureCap) &&
                featureCap <= 0m)
            {
                await LogBlockedAsync(tenantId, feature, providerKind, correlationId, actorUserId, cancellationToken)
                    .ConfigureAwait(false);

                throw new LlmTokenQuotaExceededException(
                    "This AI action is not available in the public demo workspace. Start a trial or connect your organization for full analysis.");
            }

            string cacheKey = DemoAiPromptCacheKeys.Build(systemPrompt, userPrompt);

            if (_demoPromptCache.TryGet(cacheKey, out string cached))
            {
                await LogCachedAsync(tenantId, feature, providerKind, correlationId, actorUserId, cancellationToken)
                    .ConfigureAwait(false);

                return new AiBudgetPreCallGuardResult { ServedFromDemoCache = true, CachedResponseJson = cached };
            }
        }

        if (policy.HardStopEnabled && policy.BlocksAdditionalLlmExecution)
        {
            await LogBlockedAsync(tenantId, feature, providerKind, correlationId, actorUserId, cancellationToken)
                .ConfigureAwait(false);

            string message = policy.WorkspaceKind == AiUsageWorkspaceKind.Trial
                ? "Trial AI budget exhausted. Request more credits or connect an approved AI provider."
                : "AI budget exhausted for this workspace.";

            throw new LlmTokenQuotaExceededException(message);
        }

        return new AiBudgetPreCallGuardResult();
    }

    public async Task RecordCompletionAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        int inputTokens,
        int outputTokens,
        decimal? estimatedCostUsd,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default)
    {
        TenantAiBudgetPolicySnapshot policy =
            await _policyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (policy.CustomerAiProviderConfigured)
        {
            return;
        }

        await _usageEventRepository.InsertAsync(
            new AiUsageEventRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = actorUserId,
                Feature = feature,
                ProviderKind = providerKind,
                InputTokens = inputTokens,
                OutputTokens = outputTokens,
                EstimatedCostUsd = estimatedCostUsd ?? 0m,
                OccurredUtc = _timeProvider.GetUtcNow(),
                CorrelationId = correlationId,
            },
            cancellationToken).ConfigureAwait(false);
    }

    private Task LogCachedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken) =>
        _usageEventRepository.InsertAsync(
            new AiUsageEventRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = actorUserId,
                Feature = feature,
                ProviderKind = providerKind,
                OccurredUtc = _timeProvider.GetUtcNow(),
                CorrelationId = correlationId,
                ServedFromDemoCache = true,
            },
            cancellationToken);

    private Task LogBlockedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken) =>
        _usageEventRepository.InsertAsync(
            new AiUsageEventRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = actorUserId,
                Feature = feature,
                ProviderKind = providerKind,
                OccurredUtc = _timeProvider.GetUtcNow(),
                CorrelationId = correlationId,
                BudgetBlocked = true,
            },
            cancellationToken);
}
