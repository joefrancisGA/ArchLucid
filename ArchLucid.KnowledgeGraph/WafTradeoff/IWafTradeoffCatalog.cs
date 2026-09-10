namespace ArchLucid.KnowledgeGraph.WafTradeoff;

public interface IWafTradeoffCatalog
{
    IReadOnlyList<WafTradeoffCatalogEntry> All { get; }

    WafTradeoffCatalogEntry? FindByKey(string mechanismKey);

    WafTradeoffCatalogEntry? FindCounterfactual(string mechanismKey);
}
