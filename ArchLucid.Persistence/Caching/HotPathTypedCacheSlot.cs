namespace ArchLucid.Persistence.Caching;

/// <summary>
///     HybridCache payload that preserves negative-cache semantics while allowing L1 hits to return typed values
///     without a manual JSON round-trip (TB-590).
/// </summary>
/// <typeparam name="T">Cached reference type.</typeparam>
public sealed record HotPathTypedCacheSlot<T>(bool IsPresent, T? Value) where T : class;
