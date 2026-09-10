namespace ArchLucid.Core.InfraEvidence;

/// <summary>SA-13 incremental SecureNow architect path invalidation options.</summary>
public sealed class SecureNowArchitectNeighborhoodOptions
{
    public const string SectionName = "ArchLucid:SecureNowArchitect:Neighborhood";

    /// <summary>When true, post-materialize runs full-estate engines (tests/ops). Default false.</summary>
    public bool FullRecompute
    {
        get;
        init;
    }
}
