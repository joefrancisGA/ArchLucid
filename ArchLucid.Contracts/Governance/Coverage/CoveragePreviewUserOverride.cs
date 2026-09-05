namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Operator override for a single pack row in coverage preview (dry-run only).</summary>
public sealed class CoveragePreviewUserOverride
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    /// <summary>When true, the pack is excluded from this preview even if otherwise included.</summary>
    public bool Excluded
    {
        get;
        set;
    }

    public string? ExclusionReason
    {
        get;
        set;
    }
}
