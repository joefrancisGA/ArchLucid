using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper-backed persistence for <see cref="ArchitectureRequest" /> entities, serialising request state as JSON.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class ArchitectureRequestRepository(IDbConnectionFactory connectionFactory)
    : IArchitectureRequestRepository
{
    public async Task CreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        const string sql = """
                           INSERT INTO ArchitectureRequests
                           (
                               RequestId,
                               SystemName,
                               Environment,
                               CloudProvider,
                               RequestJson,
                               CreatedUtc,
                               IsArchived
                           )
                           VALUES
                           (
                               @RequestId,
                               @SystemName,
                               @Environment,
                               @CloudProvider,
                               @RequestJson,
                               @CreatedUtc,
                               @IsArchived
                           );
                           """;

        string json = JsonSerializer.Serialize(request, ContractJson.Default);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    request.RequestId,
                    request.SystemName,
                    request.Environment,
                    CloudProvider = request.CloudProvider.ToString(),
                    RequestJson = json,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    IsArchived = request.IsArchived
                },
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<ArchitectureRequest?> GetByIdAsync(string requestId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT RequestJson
                           FROM ArchitectureRequests
                           WHERE RequestId = @RequestId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,
            new { RequestId = requestId },
            cancellationToken: cancellationToken));

        if (json is null)
            return null;

        ArchitectureRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Request JSON for '{requestId}' could not be deserialized. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }

        return request
               ?? throw new InvalidOperationException(
                   $"Request JSON for '{requestId}' deserialized to null. " +
                   "The stored JSON may be empty or corrupt.");
    }

    public async Task<IReadOnlyDictionary<string, ArchitectureRequest>> ListByIdsAsync(
        IReadOnlyCollection<string> requestIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(requestIds);

        List<string> normalized = requestIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalized.Count == 0)
            return new Dictionary<string, ArchitectureRequest>(StringComparer.Ordinal);

        const string sql = """
                           SELECT RequestId, RequestJson
                           FROM ArchitectureRequests
                           WHERE RequestId IN @RequestIds;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ArchitectureRequestIdRow> rows = await connection.QueryAsync<ArchitectureRequestIdRow>(
            new CommandDefinition(sql, new { RequestIds = normalized }, cancellationToken: cancellationToken));

        Dictionary<string, ArchitectureRequest> map = new(StringComparer.Ordinal);

        foreach (ArchitectureRequestIdRow row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.RequestJson))
                continue;

            ArchitectureRequest? request;

            try
            {
                request = JsonSerializer.Deserialize<ArchitectureRequest>(row.RequestJson, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Request JSON for '{row.RequestId}' could not be deserialized. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.",
                    ex);
            }

            if (request is null)
                throw new InvalidOperationException(
                    $"Request JSON for '{row.RequestId}' deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            map[row.RequestId] = request;
        }

        return map;
    }

    private sealed class ArchitectureRequestIdRow
    {
        public string RequestId
        {
            get;
            init;
        } = string.Empty;

        public string RequestJson
        {
            get;
            init;
        } = string.Empty;
    }

    public async Task ArchiveAsync(string requestId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE ArchitectureRequests
                           SET IsArchived = 1
                           WHERE RequestId = @RequestId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { RequestId = requestId },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task RestoreAsync(string requestId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE ArchitectureRequests
                           SET IsArchived = 0
                           WHERE RequestId = @RequestId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { RequestId = requestId },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<bool> ReplaceAsync(ArchitectureRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.RequestId))
            throw new ArgumentException("RequestId is required.", nameof(request));

        const string sql = """
                           UPDATE ArchitectureRequests
                           SET
                               SystemName = @SystemName,
                               Environment = @Environment,
                               CloudProvider = @CloudProvider,
                               RequestJson = @RequestJson
                           WHERE RequestId = @RequestId;
                           """;

        string json = JsonSerializer.Serialize(request, ContractJson.Default);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                request.RequestId,
                request.SystemName,
                request.Environment,
                CloudProvider = request.CloudProvider.ToString(),
                RequestJson = json,
            },
            cancellationToken: cancellationToken));

        return rows > 0;
    }
}
