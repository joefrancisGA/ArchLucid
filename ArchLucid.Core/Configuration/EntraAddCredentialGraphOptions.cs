namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional Microsoft Graph reads for application owners, directory roles, and Graph app roles (add-credential paths).
/// </summary>
public sealed class EntraAddCredentialGraphOptions
{
    public const string SectionName = "EntraAddCredentialGraph";

    /// <summary>When false, hosted collectors must not call Microsoft Graph for add-credential companions.</summary>
    public bool Enabled { get; set; }

    /// <summary>Maximum Graph page requests per endpoint during one collection.</summary>
    public int MaxPaginationRequests { get; set; } = 64;

    /// <summary>Maximum application owner lookups per collection (0 = no cap).</summary>
    public int MaxApplicationOwnerRequests { get; set; } = 500;
}
