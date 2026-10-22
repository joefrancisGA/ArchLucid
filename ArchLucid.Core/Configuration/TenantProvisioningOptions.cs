namespace ArchLucid.Core.Configuration;

/// <summary>Operator controls for <see cref="Tenancy.ITenantProvisioningService.ProvisionAsync" />.</summary>
public sealed class TenantProvisioningOptions
{
    public const string SectionName = "TenantProvisioning";

    /// <summary>Normalized lowercase Azure region identifiers allowed on provision requests (<c>null</c> uses code defaults).</summary>
    public IList<string>? SupportedDataRegions { get; set; }
}
