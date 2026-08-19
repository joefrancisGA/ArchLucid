using System.Text.Json.Serialization;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>JSON for <c>GET /v1/tenant/workspaces</c> (nested projects per workspace).</summary>
public sealed class TenantWorkspacesListResponse
{
    /// <summary>
    /// Soft-delete retention window (days) before permanent purge — shared with recycle-bin UI copy.
    /// </summary>
    [JsonPropertyName("retentionDays")]
    public int RetentionDays
    {
        get;
        init;
    }

    [JsonPropertyName("workspaces")]
    public IReadOnlyList<TenantWorkspaceApiDto> Workspaces
    {
        get;
        init;
    } = [];
}

/// <summary>Workspace shell with architecture projects visible to the operator.</summary>
public sealed class TenantWorkspaceApiDto
{
    [JsonPropertyName("workspaceId")]
    public Guid WorkspaceId
    {
        get;
        init;
    }

    /// <summary>Stable workspace label (may match <see cref="DisplayName" />).</summary>
    [JsonPropertyName("name")]
    public string Name
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Optional UI display name (falls back to <see cref="Name" /> when unset).</summary>
    [JsonPropertyName("displayName")]
    public string? DisplayName
    {
        get;
        init;
    }

    [JsonPropertyName("defaultProjectId")]
    public Guid DefaultProjectId
    {
        get;
        init;
    }

    [JsonPropertyName("projects")]
    public IReadOnlyList<TenantWorkspaceProjectApiDto> Projects
    {
        get;
        init;
    } = [];
}

/// <summary>Architecture project within a workspace.</summary>
public sealed class TenantWorkspaceProjectApiDto
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
}
