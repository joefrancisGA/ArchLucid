using System.Text.Json;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Metadata;
using ArchiForge.Data.Infrastructure;
using Dapper;

namespace ArchiForge.Data.Repositories;

public sealed class DecisionTraceRepository : IDecisionTraceRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public DecisionTraceRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task CreateManyAsync(IEnumerable<DecisionTrace> traces, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO DecisionTraces
            (
                TraceId,
                RunId,
                EventType,
                EventDescription,
                EventJson,
                CreatedUtc
            )
            VALUES
            (
                @TraceId,
                @RunId,
                @EventType,
                @EventDescription,
                @EventJson,
                @CreatedUtc
            );
            """;

        using var connection = _connectionFactory.CreateConnection();

        var rows = traces.Select(t => new
        {
            t.TraceId,
            t.RunId,
            t.EventType,
            t.EventDescription,
            EventJson = JsonSerializer.Serialize(t, ContractJson.Default),
            t.CreatedUtc
        });

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            rows,
            cancellationToken: cancellationToken));
    }
}