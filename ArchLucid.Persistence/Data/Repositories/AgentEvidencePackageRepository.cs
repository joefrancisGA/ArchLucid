using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentEvidencePackageRepository(IDbConnectionFactory connectionFactory)
    : IAgentEvidencePackageRepository
{
    public async Task CreateAsync(
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidencePackage);

        const string insertSql = """
                                 INSERT INTO AgentEvidencePackages
                                 (
                                     EvidencePackageId,
                                     RunId,
                                     RequestId,
                                     SystemName,
                                     Environment,
                                     CloudProvider,
                                     EvidenceJson,
                                     CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @EvidencePackageId,
                                     @RunId,
                                     @RequestId,
                                     @SystemName,
                                     @Environment,
                                     @CloudProvider,
                                     @EvidenceJson,
                                     @CreatedUtc
                                 );
                                 """;

        string json = JsonSerializer.Serialize(evidencePackage, ContractJson.Default);

        var parameters = new
        {
            evidencePackage.EvidencePackageId,
            RunId = SqlRunIdMapping.ToSqlRunId(evidencePackage.RunId),
            evidencePackage.RequestId,
            evidencePackage.SystemName,
            evidencePackage.Environment,
            evidencePackage.CloudProvider,
            EvidenceJson = json,
            evidencePackage.CreatedUtc
        };

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    transaction,
                    cancellationToken: cancellationToken));
            }
            else
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    cancellationToken: cancellationToken));
            }
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            throw new InvalidOperationException(
                $"An evidence package already exists for run '{evidencePackage.RunId}'. Retries must roll back the enclosing unit of work.",
                ex);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<AgentEvidencePackage?> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP 1 EvidenceJson
                           FROM AgentEvidencePackages
                           WHERE RunId = @RunId
                           ORDER BY CreatedUtc DESC;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,
            new { RunId = SqlRunIdMapping.ToSqlRunId(runId) },
            cancellationToken: cancellationToken));

        return DeserializePackage(json, $"run '{runId}'");
    }

    public async Task<AgentEvidencePackage?> GetByIdAsync(
        string evidencePackageId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EvidenceJson
                           FROM AgentEvidencePackages
                           WHERE EvidencePackageId = @EvidencePackageId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,
            new { EvidencePackageId = evidencePackageId },
            cancellationToken: cancellationToken));

        return DeserializePackage(json, $"package '{evidencePackageId}'");
    }

    private static AgentEvidencePackage? DeserializePackage(string? json, string context)
    {
        if (json is null)
            return null;

        AgentEvidencePackage? package;
        try
        {
            package = JsonSerializer.Deserialize<AgentEvidencePackage>(json, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Evidence package JSON for {context} could not be deserialized. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }

        return package
               ?? throw new InvalidOperationException(
                   $"Evidence package JSON for {context} deserialized to null. " +
                   "The stored JSON may be empty or corrupt.");
    }
}
