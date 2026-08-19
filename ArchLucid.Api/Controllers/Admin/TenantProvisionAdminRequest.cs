using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>JSON body for <c>POST /v1/admin/tenants</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TenantProvisionAdminRequest
{
    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string AdminEmail
    {
        get;
        init;
    } = string.Empty;

    public TenantTier Tier
    {
        get;
        init;
    } = TenantTier.Standard;

    /// <summary>Normalized Azure geography key (<see cref="TenantDataRegions" />).</summary>
    public string DataRegion
    {
        get;
        init;
    } = TenantDataRegions.Default;
}
