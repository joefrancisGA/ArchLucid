using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Core.Agents;

/// <summary>Ensures default catalog rows exist at startup (TB-2103).</summary>
public sealed class AgentModelCatalogBootstrapper(
    IAgentModelCatalogRepository catalogRepository,
    IAgentModelCatalogCacheInvalidator cacheInvalidator)
{
    private readonly IAgentModelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IAgentModelCatalogCacheInvalidator _cacheInvalidator =
        cacheInvalidator ?? throw new ArgumentNullException(nameof(cacheInvalidator));

    public async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        int count = await _catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        if (count > 0)
        {
            return;
        }

        foreach (AgentModelCatalogRow row in AgentModelCatalogDefaultSeed.BuildDefaultRows())
        {
            await _catalogRepository.UpsertAsync(row, cancellationToken).ConfigureAwait(false);
        }

        _cacheInvalidator.Invalidate();
    }
}
