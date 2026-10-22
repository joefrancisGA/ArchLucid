namespace ArchLucid.Core.AiUsage;

public interface IAiBudgetPreCallGuard
{
    Task<AiBudgetPreCallGuardResult> EnsureAllowedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        string? systemPrompt,
        string? userPrompt,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default);

    Task RecordCompletionAsync(
        Guid tenantId,
        AiUsageFeature feature,
        string providerKind,
        int inputTokens,
        int outputTokens,
        decimal? estimatedCostUsd,
        string? correlationId,
        string? actorUserId,
        CancellationToken cancellationToken = default);
}

public sealed class AiBudgetPreCallGuardResult
{
    public bool ServedFromDemoCache
    {
        get;
        init;
    }

    public string? CachedResponseJson
    {
        get;
        init;
    }
}
