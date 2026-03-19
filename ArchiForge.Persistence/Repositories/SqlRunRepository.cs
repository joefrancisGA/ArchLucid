using System.Data.Common;
using ArchiForge.Persistence.Connections;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;
using Dapper;

namespace ArchiForge.Persistence.Repositories;

public sealed class SqlRunRepository : IRunRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public SqlRunRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task SaveAsync(RunRecord run, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.Runs
            (
                RunId, ProjectId, Description, CreatedUtc,
                ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                GoldenManifestId, DecisionTraceId, ArtifactBundleId
            )
            VALUES
            (
                @RunId, @ProjectId, @Description, @CreatedUtc,
                @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId,
                @GoldenManifestId, @DecisionTraceId, @ArtifactBundleId
            );
            """;

        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, run, cancellationToken: ct));
    }

    public async Task<RunRecord?> GetByIdAsync(Guid runId, CancellationToken ct)
    {
        const string sql = """
            SELECT
                RunId, ProjectId, Description, CreatedUtc,
                ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                GoldenManifestId, DecisionTraceId, ArtifactBundleId
            FROM dbo.Runs
            WHERE RunId = @RunId;
            """;

        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<RunRecord>(
            new CommandDefinition(sql, new { RunId = runId }, cancellationToken: ct));
    }

    public async Task UpdateAsync(RunRecord run, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.Runs
            SET
                ProjectId = @ProjectId,
                Description = @Description,
                ContextSnapshotId = @ContextSnapshotId,
                GraphSnapshotId = @GraphSnapshotId,
                FindingsSnapshotId = @FindingsSnapshotId,
                GoldenManifestId = @GoldenManifestId,
                DecisionTraceId = @DecisionTraceId,
                ArtifactBundleId = @ArtifactBundleId
            WHERE RunId = @RunId;
            """;

        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, run, cancellationToken: ct));
    }
}
