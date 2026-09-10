using ArchLucid.Core.Scoping;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

public sealed partial class DapperFindingInspectReadRepository
{
    private async Task<MainRow?> LoadMainRowAsync(
        SqlConnection connection,
        ScopeContext scope,
        string findingId,
        bool includeTypedPayload,
        CancellationToken ct)
    {
        string sql = FindingInspectReadRepositoryCore.ResolveMainInspectSql(includeTypedPayload);

        return await connection.QuerySingleOrDefaultAsync<MainRow>(
            new CommandDefinition(
                sql,
                new
                {
                    FindingId = FindingInspectReadRepositoryCore.NormalizeFindingId(findingId),
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: ct));
    }
}
