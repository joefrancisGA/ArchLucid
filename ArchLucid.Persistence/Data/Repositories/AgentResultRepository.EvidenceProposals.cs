using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class AgentResultRepository
{
    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<AgentResultEvidenceProposalRow> rows;

        try
        {
            rows = await conn.QueryAsync<AgentResultEvidenceProposalRow>(new CommandDefinition(
                AgentResultStatementFactory.BuildListEvidenceProposals(),
                PersistenceTenantScope.RunChildScopeParameters(scope),
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.Select(AgentResultProjectionMapper.MapEvidenceProposal).ToList();
    }

    public async Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        ScopeContext scope,
        string resultId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        PersistenceTenantScope.RequireRunChildScope(scope);

        DynamicParameters parameters = new(PersistenceTenantScope.RunChildScopeParameters(scope));
        parameters.Add("ResultId", resultId);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            AgentResultEvidenceProposalRow? row =
                await conn.QuerySingleOrDefaultAsync<AgentResultEvidenceProposalRow>(new CommandDefinition(
                    AgentResultStatementFactory.BuildSelectEvidenceProposalByResultId(),
                    parameters,
                    cancellationToken: cancellationToken));

            return row is null ? null : AgentResultProjectionMapper.MapEvidenceProposal(row);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }
}
