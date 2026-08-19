namespace ArchLucid.Application.Tenancy;

/// <summary>Outcome of the post-cutover migration verification probe (TB-2047).</summary>
public sealed class TenantMigrationVerificationProbeResult
{
    public bool Passed
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public string? ProbeRunId
    {
        get;
        init;
    }

    public bool WriteFreezeVerified
    {
        get;
        init;
    }

    public bool AuthorizationBoundaryVerified
    {
        get;
        init;
    }
}
