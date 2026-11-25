using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task AppendAdvisorySourceInScopeAsync(
        ProjectScopeKey scope, Guid findingId, string key, string value,
        CancellationToken cancellationToken = default)
    {
        // Insert-only provenance is independent of the authoritative observation watermark.
        const string sql = """
                           INSERT dbo.OperationalSecurityFindingMetadata
                               (MetadataRowId, FindingId, TenantId, MetadataKey, MetadataValue)
                           SELECT NEWID(), f.FindingId, f.TenantId, @Key, @Value
                           FROM dbo.OperationalSecurityFindings f
                           WHERE f.TenantId = @TenantId AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId AND f.FindingId = @FindingId
                             AND NOT EXISTS (
                                 SELECT 1 FROM dbo.OperationalSecurityFindingMetadata m WITH (UPDLOCK, HOLDLOCK)
                                 WHERE m.TenantId = f.TenantId AND m.FindingId = f.FindingId
                                   AND m.MetadataKey = @Key
                             );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, FindingId = findingId, Key = key, Value = value,
        }, cancellationToken: cancellationToken));
    }
}
