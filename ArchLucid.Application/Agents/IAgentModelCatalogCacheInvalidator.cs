namespace ArchLucid.Application.Agents;

/// <summary>Invalidates the catalog-backed alias registry cache after mutations (TB-2103).</summary>
public interface IAgentModelCatalogCacheInvalidator
{
    void Invalidate();
}
