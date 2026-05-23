namespace ArchLucid.Contracts.Governance.ComplianceDrift;

/// <summary>Findings opened vs resolved in one compliance-drift time bucket.</summary>
public sealed class ComplianceDriftFindingsBucketCounts
{
    public int OpenFindingsCount
    {
        get;
        init;
    }

    public int ResolvedFindingsCount
    {
        get;
        init;
    }
}
