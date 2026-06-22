namespace ArchLucid.Persistence.Caching;

/// <summary>Revision counter included in <see cref="HotPathCacheKeys.EffectivePolicyPackSet" /> keys.</summary>
public sealed class PolicyPackResolverRevisionState
{
    public long Revision { get; init; }
}
