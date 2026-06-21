using ArchLucid.Core.Scoping;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ephemeral tenant/workspace/project rows for greenfield SQL integration tests that must not share
///     <see cref="ScopeIds.DefaultTenant" /> demo or parallel-shard committed-run noise.
/// </summary>
internal static class GreenfieldIntegrationTenantScope
{
    internal sealed record Scope(Guid TenantId, Guid WorkspaceId, Guid ProjectId);

    internal static Scope CreateUniqueScope()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        return new Scope(tenantId, workspaceId, projectId);
    }

    internal static async Task EnsureScopeAsync(string connectionString, Scope scope, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        ArgumentNullException.ThrowIfNull(scope);

        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, @TenantName, @TenantSlug, N'Standard', NULL);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, @WorkspaceName, @Pid);
            IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @Pid)
                INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                VALUES (@Pid, @Tid, @Wid, N'integration-scope', SYSUTCDATETIME(), 0);
            """;
        cmd.Parameters.AddWithValue("@Tid", scope.TenantId);
        cmd.Parameters.AddWithValue("@Wid", scope.WorkspaceId);
        cmd.Parameters.AddWithValue("@Pid", scope.ProjectId);
        cmd.Parameters.AddWithValue("@TenantName", "Integration tenant " + scope.TenantId.ToString("N")[..12]);
        cmd.Parameters.AddWithValue("@TenantSlug", "it-tenant-" + scope.TenantId.ToString("N")[..12]);
        cmd.Parameters.AddWithValue("@WorkspaceName", "Integration workspace");

        _ = await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    internal static void WireScope(HttpClient client, Scope scope)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(scope);

        WireScope(client, scope.TenantId, scope.WorkspaceId, scope.ProjectId);
    }

    internal static void WireScope(HttpClient client, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Remove("x-project-id");
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-tenant-id", tenantId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-workspace-id", workspaceId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-project-id", projectId.ToString("D"));
    }
}
