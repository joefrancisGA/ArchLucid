using ArchLucid.Core.Pilots;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Pilots;

public sealed class DapperPilotCloseoutRepository(ISqlConnectionFactory connectionFactory) : IPilotCloseoutRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task InsertAsync(PilotCloseoutRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.PilotCloseouts (
                               CloseoutId, TenantId, WorkspaceId, ProjectId, RunId,
                               BaselineHours, SpeedScore, ManifestPackageScore, TraceabilityScore, Notes, CreatedUtc)
                           VALUES (
                               @CloseoutId, @TenantId, @WorkspaceId, @ProjectId, @RunId,
                               @BaselineHours, @SpeedScore, @ManifestPackageScore, @TraceabilityScore, @Notes, SYSUTCDATETIME());
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.CloseoutId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.RunId,
                    record.BaselineHours,
                    SpeedScore = (int)record.SpeedScore,
                    ManifestPackageScore = (int)record.ManifestPackageScore,
                    TraceabilityScore = (int)record.TraceabilityScore,
                    record.Notes
                },
                cancellationToken: cancellationToken));
    }
}
