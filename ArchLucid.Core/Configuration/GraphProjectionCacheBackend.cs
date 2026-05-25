namespace ArchLucid.Core.Configuration;

/// <summary>Backing store for graph snapshot projection cache read-through entries.</summary>
public enum GraphProjectionCacheBackend
{
    Memory = 0,

    Distributed = 1,
}
