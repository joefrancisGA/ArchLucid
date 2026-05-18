using System.Text.Json.Serialization;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Workspace slice with deleted architecture projects (recycle-bin list).</summary>
public sealed class TenantWorkspaceRecycleBinApiDto
{
    [JsonPropertyName("workspaceId")]
    public Guid WorkspaceId
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

    [JsonPropertyName("deletedProjects")]
    public IReadOnlyList<TenantWorkspaceDeletedProjectApiDto> DeletedProjects
    {
        get;
        init;
    } = [];
}
