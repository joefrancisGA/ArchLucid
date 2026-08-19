using System.Data;

using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class AgentResultEnrichmentRepository(IDbConnectionFactory connectionFactory) : IAgentResultEnrichmentRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task UpsertCalibratedConfidenceAsync(
        string resultId,
        double calibratedConfidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        const string sql = """
                           MERGE dbo.AgentResultEnrichments AS target
                           USING (SELECT @ResultId AS ResultId) AS source
                           ON target.ResultId = source.ResultId
                           WHEN MATCHED THEN
                               UPDATE SET CalibratedConfidence = @CalibratedConfidence,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (ResultId, CalibratedConfidence, UpdatedUtc)
                               VALUES (@ResultId, @CalibratedConfidence, @UpdatedUtc);
                           """;

        await ExecuteAsync(
            sql,
            new
            {
                ResultId = resultId,
                CalibratedConfidence = calibratedConfidence,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task UpsertEnrichedResultJsonAsync(
        string resultId,
        string enrichedResultJson,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        ArgumentException.ThrowIfNullOrWhiteSpace(enrichedResultJson);

        const string sql = """
                           MERGE dbo.AgentResultEnrichments AS target
                           USING (SELECT @ResultId AS ResultId) AS source
                           ON target.ResultId = source.ResultId
                           WHEN MATCHED THEN
                               UPDATE SET EnrichedResultJson = @EnrichedResultJson,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (ResultId, EnrichedResultJson, UpdatedUtc)
                               VALUES (@ResultId, @EnrichedResultJson, @UpdatedUtc);
                           """;

        await ExecuteAsync(
            sql,
            new
            {
                ResultId = resultId,
                EnrichedResultJson = enrichedResultJson,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task MarkEvidenceProposalPromotedAsync(
        string resultId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        DateTime promotedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
                           MERGE dbo.AgentResultEnrichments AS target
                           USING (SELECT @ResultId AS ResultId) AS source
                           ON target.ResultId = source.ResultId
                           WHEN MATCHED THEN
                               UPDATE SET EvidenceProposalPromotedUtc = @PromotedUtc,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (ResultId, EvidenceProposalPromotedUtc, UpdatedUtc)
                               VALUES (@ResultId, @PromotedUtc, @UpdatedUtc);
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(_connectionFactory, connection, cancellationToken).ConfigureAwait(false);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new { ResultId = resultId, PromotedUtc = promotedUtc, UpdatedUtc = promotedUtc },
                transaction: transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>> GetByResultIdsAsync(
        IReadOnlyCollection<string> resultIds,
        CancellationToken cancellationToken = default)
    {
        if (resultIds is null || resultIds.Count == 0)
            return new Dictionary<string, AgentResultEnrichmentRecord>();

        const string sql = """
                           SELECT ResultId,
                                  CalibratedConfidence,
                                  EnrichedResultJson,
                                  EvidenceProposalPromotedUtc,
                                  UpdatedUtc
                           FROM dbo.AgentResultEnrichments
                           WHERE ResultId IN @ResultIds;
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IEnumerable<AgentResultEnrichmentRecord> rows = await connection.QueryAsync<AgentResultEnrichmentRecord>(
            new CommandDefinition(sql, new { ResultIds = resultIds.ToArray() }, cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows.ToDictionary(static row => row.ResultId, StringComparer.Ordinal);
    }

    private async Task ExecuteAsync(string sql, object parameters, CancellationToken cancellationToken)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(new CommandDefinition(sql, parameters, cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}
