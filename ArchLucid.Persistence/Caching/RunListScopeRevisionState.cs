namespace ArchLucid.Persistence.Caching;

/// <summary>Revision stamp included in run list hot-path cache keys for one authority scope (TB-578).</summary>
public sealed class RunListScopeRevisionState
{
    public long Revision
    {
        get;
        init;
    }
}
