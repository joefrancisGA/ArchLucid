using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGoldenManifestRepository
{
    /// <inheritdoc />
    public async Task UpdateSealedHasherBoundSliceAsync(
        ScopeContext scope,
        ManifestDocument manifest,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(manifest);
        PersistenceTenantScope.RequireEntityTenant(manifest.TenantId);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (manifest.ManifestId == Guid.Empty)
            throw new InvalidOperationException("ManifestId is required for demo sealed-receipt repair.");

        string hasherBoundJson = GoldenManifestHasherBoundPayload.SerializeFromDocument(manifest);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(new CommandDefinition(
            GoldenManifestDemoRepairSql.UpdateHasherBoundAndManifestHash,
            new
            {
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                manifest.ManifestId,
                manifest.ManifestHash,
                HasherBoundJson = hasherBoundJson,
            },
            cancellationToken: cancellationToken));

        if (rows == 0)
        {
            throw new InvalidOperationException(
                $"Demo sealed-receipt repair did not update golden manifest '{manifest.ManifestId:D}' in scope.");
        }
    }
}
