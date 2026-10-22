namespace ArchLucid.Contracts.Admin;

/// <summary>Whether any Tier 2 cloud extractor connection exists for the tenant.</summary>
public sealed class AdminPrerequisitesCloudConnectionsSummaryResponse
{
    public bool AnyConfigured
    {
        get;
        init;
    }
}
