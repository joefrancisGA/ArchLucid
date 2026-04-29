using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Evolution;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Evolution;

/// <summary>Dapper access to <c>EvolutionSimulationRuns</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperEvolutionSimulationRunRepository(ISqlConnectionFactory connectionFactory)
    : IEvolutionSimulationRunRepository
{
    public async Task InsertAsync(EvolutionSimulationRunRecord record, CancellationToken cancellationToken)
    {
        const string scopeSql = """
                                SELECT TenantId, WorkspaceId, ProjectId
                                FROM dbo.EvolutionCandidateChangeSets
                                WHERE CandidateChangeSetId = @CandidateChangeSetId;
                                """;

        const string sql = """
                           INSERT INTO dbo.EvolutionSimulationRuns
                           (
                               SimulationRunId,
                               CandidateChangeSetId,
                               BaselineArchitectureRunId,
                               EvaluationMode,
                               OutcomeJson,
                               WarningsJson,
                               CompletedUtc,
                               IsShadowOnly,
                               TenantId,
                               WorkspaceId,
                               ProjectId
                           )
                           VALUES
                           (
                               @SimulationRunId,
                               @CandidateChangeSetId,
                               @BaselineArchitectureRunId,
                               @EvaluationMode,
                               @OutcomeJson,
                               @WarningsJson,
                               @CompletedUtc,
                               @IsShadowOnly,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId
                           );
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        EvolutionSimulationScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<EvolutionSimulationScopeRow>(
                new CommandDefinition(scopeSql, new { record.CandidateChangeSetId }, cancellationToken: cancellationToken));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ProjectId is null)
            throw new InvalidOperationException(
                "dbo.EvolutionCandidateChangeSets row for CandidateChangeSetId=" + record.CandidateChangeSetId
                + " lacks denormalized RLS scope; cannot persist EvolutionSimulationRuns.");

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.SimulationRunId,
                    record.CandidateChangeSetId,
                    record.BaselineArchitectureRunId,
                    record.EvaluationMode,
                    record.OutcomeJson,
                    record.WarningsJson,
                    record.CompletedUtc,
                    record.IsShadowOnly,
                    TenantId = scopeHdr.TenantId!.Value,
                    WorkspaceId = scopeHdr.WorkspaceId!.Value,
                    ProjectId = scopeHdr.ProjectId!.Value
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<EvolutionSimulationRunRecord>> ListByCandidateAsync(
        Guid candidateChangeSetId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
                               SimulationRunId,
                               CandidateChangeSetId,
                               BaselineArchitectureRunId,
                               EvaluationMode,
                               OutcomeJson,
                               WarningsJson,
                               CompletedUtc,
                               IsShadowOnly
                           FROM dbo.EvolutionSimulationRuns
                           WHERE CandidateChangeSetId = @CandidateChangeSetId
                           ORDER BY BaselineArchitectureRunId ASC, CompletedUtc ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<EvolutionSimulationRunRecord> rows = await connection.QueryAsync<EvolutionSimulationRunRecord>(
            new CommandDefinition(
                sql,
                new { CandidateChangeSetId = candidateChangeSetId },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task DeleteByCandidateAsync(Guid candidateChangeSetId, CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.EvolutionSimulationRuns
                           WHERE CandidateChangeSetId = @CandidateChangeSetId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { CandidateChangeSetId = candidateChangeSetId },
                cancellationToken: cancellationToken));
    }

    private sealed record EvolutionSimulationScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ProjectId);
}
