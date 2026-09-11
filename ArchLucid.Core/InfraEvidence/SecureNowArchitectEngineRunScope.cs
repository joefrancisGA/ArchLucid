namespace ArchLucid.Core.InfraEvidence;

/// <summary>Optional neighborhood scope for SecureNow architect engines (SA-13).</summary>
public sealed class SecureNowArchitectEngineRunScope
{
    public IReadOnlySet<Guid> SeedCloudResourceIds
    {
        get;
        init;
    } = new HashSet<Guid>();

    public bool IsFullEstate
    {
        get;
        init;
    }

    public static SecureNowArchitectEngineRunScope FullEstate() =>
        new()
        {
            IsFullEstate = true,
        };

    public static SecureNowArchitectEngineRunScope Neighborhood(IReadOnlySet<Guid> seedCloudResourceIds) =>
        new()
        {
            SeedCloudResourceIds = seedCloudResourceIds,
            IsFullEstate = false,
        };
}
