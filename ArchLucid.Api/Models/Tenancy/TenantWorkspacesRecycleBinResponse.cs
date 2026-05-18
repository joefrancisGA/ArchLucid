using System.Text.Json.Serialization;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>JSON for <c>GET /v1/tenant/workspaces/recycle-bin</c>.</summary>
public sealed class TenantWorkspacesRecycleBinResponse
{
    [JsonPropertyName("workspaces")]
    public IReadOnlyList<TenantWorkspaceRecycleBinApiDto> Workspaces
    {
        get;
        init;
    } = [];
}
