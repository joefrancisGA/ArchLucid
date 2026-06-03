using System.Diagnostics.CodeAnalysis;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

[ExcludeFromCodeCoverage(Justification = "SQL Server session context; integration-tested via reader unit tests with mocks.")]
public sealed class SqlRlsSessionContextApplicator : IRlsSessionContextApplicator
{
    private const string ApplySql = """
        EXEC sys.sp_set_session_context @key = N'al_tenant_id', @value = @TenantId, @read_only = 0;
        EXEC sys.sp_set_session_context @key = N'al_workspace_id', @value = @WorkspaceId, @read_only = 0;
        EXEC sys.sp_set_session_context @key = N'al_project_id', @value = @ProjectId, @read_only = 0;
        EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = 0, @read_only = 0;
        """;

    public async Task ApplyAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connection);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (projectId == Guid.Empty)
            throw new ArgumentException("Project id is required.", nameof(projectId));

        await using SqlCommand command = new(ApplySql, connection);
        command.Parameters.Add(new SqlParameter("@TenantId", tenantId));
        command.Parameters.Add(new SqlParameter("@WorkspaceId", workspaceId));
        command.Parameters.Add(new SqlParameter("@ProjectId", projectId));

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }
}
