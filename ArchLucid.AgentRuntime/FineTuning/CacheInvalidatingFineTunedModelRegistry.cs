using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Registry;

namespace ArchLucid.AgentRuntime.FineTuning;

/// <summary>
///     Evicts cached Azure OpenAI completion clients when a tenant's promoted fine-tuned deployment is rolled back.
/// </summary>
public sealed class CacheInvalidatingFineTunedModelRegistry(
    IFineTunedModelRegistry inner,
    AzureOpenAiCompletionClientCache completionClientCache) : IFineTunedModelRegistry
{
    private readonly IFineTunedModelRegistry _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly AzureOpenAiCompletionClientCache _completionClientCache =
        completionClientCache ?? throw new ArgumentNullException(nameof(completionClientCache));

    /// <inheritdoc />
    public Task SaveAsync(FineTunedModelRegistryEntry entry, CancellationToken cancellationToken) =>
        _inner.SaveAsync(entry, cancellationToken);

    /// <inheritdoc />
    public Task<FineTunedModelRegistryEntry?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _inner.TryGetActiveAsync(tenantId, cancellationToken);

    /// <inheritdoc />
    public async Task RollbackActiveAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        FineTunedModelRegistryEntry? active = await _inner
            .TryGetActiveAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        await _inner.RollbackActiveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        string? deploymentName = active?.FineTunedModelDeploymentName?.Trim();

        if (string.IsNullOrEmpty(deploymentName))
        {
            return;
        }

        _completionClientCache.TryRemove(deploymentName);
    }
}
