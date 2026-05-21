namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>Operator-facing provider selection for graph projection cache (mirrors hot-path cache Auto semantics).</summary>
public enum GraphProjectionCacheProvider
{
    Auto = 0,

    Memory = 1,

    Distributed = 2,
}
