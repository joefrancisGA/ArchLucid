namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>PUT /v1/tenant/homepage-settings</c>.</summary>
public sealed class TenantHomepageSettingsPutRequest
{
    public Guid? SelectedRunId { get; init; }
}
