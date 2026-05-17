namespace ArchLucid.Core.Tenancy;

/// <summary>Logical keys for tenant data residency; <see cref="Default" /> means use deployment-wide defaults.</summary>
public static class TenantDataRegions
{
    /// <summary>
    ///     Stored on <c>dbo.Tenants.DataRegion</c> when residency follows the deployment's primary blob/SQL geography
    ///     (no per-tenant alternate storage bindings).
    /// </summary>
    public const string Default = "default";

    /// <summary>
    ///     Allowlist applied when configuration does not specify <see cref="Configuration.TenantProvisioningOptions.SupportedDataRegions" />.
    /// </summary>
    /// <remarks>Matches common Azure-first buyer regions; extend via configuration rather than widening this silently.</remarks>
    public static readonly string[] PlatformDefaultSupportedRegions =
    [
        Default,
        "eastus",
        "eastus2",
        "westus2",
        "centralus",
        "westeurope",
        "northeurope",
        "uksouth",
        "southeastasia",
        "australiaeast",
        "centralindia",
        "brazilsouth",
    ];

    /// <summary>Lowercase trimming; callers must enforce allowlists separately.</summary>
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Data region cannot be empty.", nameof(value));

        return value.Trim().ToLowerInvariant();
    }

    /// <summary>Empty or whitespace resolves to <see cref="Default" />.</summary>
    public static string NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? Default : Normalize(value);
}
