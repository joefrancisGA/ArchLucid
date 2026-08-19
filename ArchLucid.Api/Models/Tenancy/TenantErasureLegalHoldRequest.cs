namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Legal/regulatory hold extension for tenant scheduled erasure.</summary>
public sealed class TenantErasureLegalHoldRequest
{
    /// <summary>Hold remains effective until this UTC instant (exclusive of purge while <c>UtcNow &lt; UntilUtc</c>).</summary>
    public DateTimeOffset UntilUtc
    {
        get;
        set;
    }

    public string? Reason
    {
        get;
        set;
    }
}
