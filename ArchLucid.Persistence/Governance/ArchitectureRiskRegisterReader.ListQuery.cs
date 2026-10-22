using ArchLucid.Core.Governance;
using ArchLucid.Contracts.Governance;

using Dapper;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureRiskRegisterReader
{
    public async Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        int maxRows,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        string sql = BuildListQuerySql(projectId, options);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskRegisterRow> rows = await conn.QueryAsync<RiskRegisterRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    MaxRows = maxRows,
                    AssignedToUserIdsLower = ResolveAssignedToUserIdsLower(options),
                },
                cancellationToken: cancellationToken));

        return ProjectListRows(rows);
    }
}
