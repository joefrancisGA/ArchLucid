using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper-backed persistence for <see cref="IEvidenceBundleRepository" />; writes and reads evidence bundle records
///     from the <c>EvidenceBundles</c> table.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
[TenantScopeExempt(TenantScopeExemptReason.AcceptedResidual, "Legacy EvidenceBundles surface; access stays behind scoped application APIs per classification doc.")]
public sealed class EvidenceBundleRepository(IDbConnectionFactory connectionFactory) : IEvidenceBundleRepository
{
    // The storage-owned member is not part of the public EvidenceBundle model. The scoped query
    // filters it in SQL before returning content, and ordinary content updates retain it.
    private const string RunBindingMember = "deferredRunBindingV1";
    private const string BoundBundleQuerySource = $"""
        FROM dbo.EvidenceBundles
        CROSS APPLY (VALUES (JSON_QUERY(CASE WHEN ISJSON(EvidenceJson) = 1 THEN EvidenceJson END,
            '$.{RunBindingMember}'))) AS binding(Value)
        WHERE EvidenceBundleId = @EvidenceBundleId
          AND EvidenceBundleId COLLATE Latin1_General_100_BIN2 = @EvidenceBundleId COLLATE Latin1_General_100_BIN2
          AND DATALENGTH(EvidenceBundleId) = DATALENGTH(@EvidenceBundleId)
          AND JSON_VALUE(CASE WHEN ISJSON(EvidenceJson) = 1 THEN EvidenceJson END, '$.evidenceBundleId') COLLATE Latin1_General_100_BIN2 = @EvidenceBundleId COLLATE Latin1_General_100_BIN2
          AND DATALENGTH(JSON_VALUE(CASE WHEN ISJSON(EvidenceJson) = 1 THEN EvidenceJson END, '$.evidenceBundleId')) = DATALENGTH(@EvidenceBundleId)
          AND TRY_CONVERT(uniqueidentifier, JSON_VALUE(binding.Value, '$.tenantId')) = @TenantId
          AND TRY_CONVERT(uniqueidentifier, JSON_VALUE(binding.Value, '$.workspaceId')) = @WorkspaceId
          AND TRY_CONVERT(uniqueidentifier, JSON_VALUE(binding.Value, '$.projectId')) = @ProjectId
          AND TRY_CONVERT(uniqueidentifier, JSON_VALUE(binding.Value, '$.runId')) = @RunId
        """;

    public Task CreateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        return CreateCoreAsync(evidenceBundle, JsonSerializer.Serialize(evidenceBundle, ContractJson.Default),
            connection, transaction, cancellationToken);
    }

    public Task CreateForRunAsync(EvidenceBundle evidenceBundle, ScopeContext scope, Guid runId,
        CancellationToken cancellationToken = default, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        if (!HasCompleteBinding(scope, runId, evidenceBundle.EvidenceBundleId))
            throw new ArgumentException("A complete scope, run and bundle ID are required for deferred evidence binding.");

        JsonObject stored = JsonSerializer.SerializeToNode(evidenceBundle, ContractJson.Default)!.AsObject();
        stored[RunBindingMember] = new JsonObject
        {
            ["tenantId"] = scope.TenantId.ToString("D"),
            ["workspaceId"] = scope.WorkspaceId.ToString("D"),
            ["projectId"] = scope.ProjectId.ToString("D"),
            ["runId"] = runId.ToString("D"),
        };
        return CreateCoreAsync(evidenceBundle, stored.ToJsonString(), connection, transaction, cancellationToken);
    }

    private async Task CreateCoreAsync(EvidenceBundle evidenceBundle, string json,
        IDbConnection? connection, IDbTransaction? transaction, CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO EvidenceBundles
                           (
                               EvidenceBundleId,
                               RequestDescription,
                               EvidenceJson,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @EvidenceBundleId,
                               @RequestDescription,
                               @EvidenceJson,
                               @CreatedUtc
                           );
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    evidenceBundle.EvidenceBundleId,
                    evidenceBundle.RequestDescription,
                    EvidenceJson = json,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                },
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<EvidenceBundle?> GetByIdAsync(string evidenceBundleId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EvidenceJson
                           FROM EvidenceBundles
                           WHERE EvidenceBundleId = @EvidenceBundleId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,
            new { EvidenceBundleId = evidenceBundleId },
            cancellationToken: cancellationToken));

        return json is null ? null : DeserializeBundle(evidenceBundleId, json);
    }

    public async Task<bool> IsBoundToRunAsync(ScopeContext scope, Guid runId, string evidenceBundleId,
        CancellationToken cancellationToken = default)
    {
        if (!HasCompleteBinding(scope, runId, evidenceBundleId))
            return false;

        const string sql = $"SELECT CONVERT(bit, CASE WHEN EXISTS (SELECT 1 {BoundBundleQuerySource}) THEN 1 ELSE 0 END);";
        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql,
            new { EvidenceBundleId = evidenceBundleId, scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId },
            cancellationToken: cancellationToken));
    }

    public async Task<EvidenceBundle?> GetForRunAsync(ScopeContext scope, Guid runId, string evidenceBundleId,
        CancellationToken cancellationToken = default)
    {
        if (!HasCompleteBinding(scope, runId, evidenceBundleId))
            return null;

        const string sql = $"SELECT EvidenceJson {BoundBundleQuerySource};";
        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(sql,
            new { EvidenceBundleId = evidenceBundleId, scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId },
            cancellationToken: cancellationToken));
        EvidenceBundle? bundle = json is null ? null : DeserializeBundle(evidenceBundleId, json);
        return bundle is not null && string.Equals(bundle.EvidenceBundleId, evidenceBundleId, StringComparison.Ordinal)
            ? bundle
            : null;
    }

    private static bool HasCompleteBinding(ScopeContext scope, Guid runId, string evidenceBundleId) =>
        CommittedRunEvidenceBinding.HasExplicitScope(scope) && runId != Guid.Empty && !string.IsNullOrWhiteSpace(evidenceBundleId);

    private static EvidenceBundle DeserializeBundle(string evidenceBundleId, string json)
    {
        EvidenceBundle? bundle;
        try
        {
            bundle = JsonSerializer.Deserialize<EvidenceBundle>(json, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Evidence bundle JSON for '{evidenceBundleId}' could not be deserialized. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }

        return bundle
               ?? throw new InvalidOperationException(
                   $"Evidence bundle JSON for '{evidenceBundleId}' deserialized to null. " +
                   "The stored JSON may be empty or corrupt.");
    }

    public async Task UpdateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);

        const string sql = $"""
                           UPDATE EvidenceBundles
                           SET EvidenceJson = JSON_MODIFY(@EvidenceJson, '$.{RunBindingMember}',
                               JSON_QUERY(CASE WHEN ISJSON(EvidenceJson) = 1 THEN EvidenceJson END, '$.{RunBindingMember}'))
                           WHERE EvidenceBundleId = @EvidenceBundleId;
                           """;

        string json = JsonSerializer.Serialize(evidenceBundle, ContractJson.Default);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            int rows = await conn.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { evidenceBundle.EvidenceBundleId, EvidenceJson = json },
                    transaction,
                    cancellationToken: cancellationToken));

            if (rows != 1)
                throw new InvalidOperationException(
                    $"Evidence bundle '{evidenceBundle.EvidenceBundleId}' update affected {rows} rows (expected 1).");
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }
}
