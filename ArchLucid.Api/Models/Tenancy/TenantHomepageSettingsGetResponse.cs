namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>GET /v1/tenant/homepage-settings</c>.</summary>
public sealed class TenantHomepageSettingsGetResponse
{
    public Guid? SelectedRunId { get; init; }

    public bool IsConfigured { get; init; }

    public bool IsAvailable { get; init; }

    public string? ReviewTitle { get; init; }

    public string? ArchitectureName { get; init; }

    public DateTimeOffset? CompletedUtc { get; init; }

    public bool IsSampleApproved { get; init; }
}
