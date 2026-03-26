using System.Data;

using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Core.Scoping;
using ArchiForge.Persistence.Connections;
using ArchiForge.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchiForge.Persistence.Repositories;

/// <summary>
/// SQL Server-backed implementation of <see cref="IArtifactBundleRepository"/>.
/// Persists and retrieves <see cref="ArtifactBundle"/> rows from the <c>dbo.ArtifactBundles</c> table,
/// serializing the artifact list and synthesis trace to JSON columns.
/// </summary>
public sealed class SqlArtifactBundleRepository(ISqlConnectionFactory connectionFactory) : IArtifactBundleRepository
{
    public async Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(bundle);

        const string sql = """
            INSERT INTO dbo.ArtifactBundles
            (
                BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson
            )
            VALUES
            (
                @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson
            );
            """;

        object args = new
        {
            bundle.BundleId,
            bundle.RunId,
            bundle.ManifestId,
            bundle.CreatedUtc,
            ArtifactsJson = JsonEntitySerializer.Serialize(bundle.Artifacts),
            TraceJson = JsonEntitySerializer.Serialize(bundle.Trace)
        };

        if (connection is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct)).ConfigureAwait(false);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await owned.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<ArtifactBundle?> GetByManifestIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT TOP 1
                TenantId, WorkspaceId, ProjectId,
                BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson
            FROM dbo.ArtifactBundles
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ScopeProjectId
              AND ManifestId = @ManifestId
            ORDER BY CreatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        ArtifactBundleRow? row = await connection.QuerySingleOrDefaultAsync<ArtifactBundleRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ManifestId = manifestId
                },
                cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return null;

        try
        {
            return new ArtifactBundle
            {
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                BundleId = row.BundleId,
                RunId = row.RunId,
                ManifestId = row.ManifestId,
                CreatedUtc = row.CreatedUtc,
                Artifacts = JsonEntitySerializer.Deserialize<List<SynthesizedArtifact>>(row.ArtifactsJson),
                Trace = JsonEntitySerializer.Deserialize<SynthesisTrace>(row.TraceJson)
            };
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize ArtifactBundle '{row.BundleId}' for manifest '{row.ManifestId}'. " +
                "The stored JSON may be corrupt or from an incompatible schema version.", ex);
        }
    }

    private sealed class ArtifactBundleRow
    {
        public Guid TenantId
        {
            get; init;
        }
        public Guid WorkspaceId
        {
            get; init;
        }
        public Guid ProjectId
        {
            get; init;
        }
        public Guid BundleId
        {
            get; init;
        }
        public Guid RunId
        {
            get; init;
        }
        public Guid ManifestId
        {
            get; init;
        }
        public DateTime CreatedUtc
        {
            get; init;
        }
        public string ArtifactsJson { get; init; } = null!;
        public string TraceJson { get; init; } = null!;
    }
}
