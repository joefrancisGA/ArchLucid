using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Budgeting;

namespace ArchLucid.AgentRuntime;

public sealed class PassthroughTenantLlmMonthlyBudgetCapResolver : ITenantLlmMonthlyBudgetCapResolver
{
    public Task<decimal?> ResolveHardCapUsdAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        Task.FromResult<decimal?>(null);

    public Task<bool> IsWalletOverageAllowedAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        Task.FromResult(true);
}

public sealed class NoOpAiBudgetPreCallGuard : IAiBudgetPreCallGuard
{
    public Task<AiBudgetPreCallGuardResult> EnsureAllowedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        string? systemPrompt,
        string? userPrompt,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new AiBudgetPreCallGuardResult());

    public Task RecordCompletionAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        int inputTokens,
        int outputTokens,
        decimal? estimatedCostUsd,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

public sealed class NoOpDemoAiPromptCache : IDemoAiPromptCache
{
    public bool TryGet(string cacheKey, out string responseJson)
    {
        responseJson = string.Empty;

        return false;
    }

    public void Set(string cacheKey, string responseJson)
    {
    }
}
