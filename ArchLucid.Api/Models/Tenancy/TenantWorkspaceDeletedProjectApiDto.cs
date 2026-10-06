using System.Text.Json.Serialization;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Soft-deleted architecture project row for recycle-bin APIs.</summary>
public sealed class TenantWorkspaceDeletedProjectApiDto
{
    [JsonPropertyName("projectId")]
    public Guid ProjectId
    {
        get;
        init;
    }

    [JsonPropertyName("name")]
    public string Name
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("displayName")]
    public string? DisplayName
    {
        get;
        init;
    }

    [JsonPropertyName("deletedUtc")]
    public DateTimeOffset DeletedUtc
    {
        get;
        init;
    }

    /// <summary>
    ///     When null, retention hard-purge does not apply (for example the row is still referenced as
    ///     <c>TenantWorkspaces.DefaultProjectId</c>).
    /// </summary>
    [JsonPropertyName("purgeAfterUtc")]
    public DateTimeOffset? PurgeAfterUtc
    {
        get;
        init;
    }
}
