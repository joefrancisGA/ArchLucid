using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlCloudResourceIdentityDirectory
{
    public async Task<IReadOnlyDictionary<string, CloudResourceIdentityRecord>> UpsertSnapshotBatchAsync(
        ScopeContext scope,
        CloudProvider provider,
        Guid snapshotId,
        IReadOnlyList<CloudResourceIdentitySnapshotWrite> resources,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(resources);
        Dictionary<string, CloudResourceIdentitySnapshotWrite> distinct = new(StringComparer.OrdinalIgnoreCase);
        foreach (CloudResourceIdentitySnapshotWrite resource in resources)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(resource.ExternalResourceId);
            string key = ArmResourceIdNormalizer.Normalize(resource.ExternalResourceId);
            distinct.TryGetValue(key, out CloudResourceIdentitySnapshotWrite? previous);
            distinct[key] = resource with
            {
                ResourceType = resource.ResourceType ?? previous?.ResourceType,
                SubscriptionOrAccountId = resource.SubscriptionOrAccountId ?? previous?.SubscriptionOrAccountId,
                ResourceGroupOrProject = resource.ResourceGroupOrProject ?? previous?.ResourceGroupOrProject,
                Region = resource.Region ?? previous?.Region,
                DisplayName = resource.DisplayName ?? previous?.DisplayName,
            };
        }
        if (distinct.Count == 0)
            return new Dictionary<string, CloudResourceIdentityRecord>(StringComparer.OrdinalIgnoreCase);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Identity batch upsert requires SqlConnection.");
        using SqlTransaction tx = sqlConn.BeginTransaction();
        const string stageSql = """
            SELECT TOP (0) CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider,
                ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId, ResourceGroupOrProject,
                Region, DisplayName, FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc
            INTO #IdentitySnapshot FROM dbo.CloudResourceIdentities
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId;
            """;
        await sqlConn.ExecuteAsync(new CommandDefinition(stageSql, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId }, transaction: tx,
            commandTimeout: DapperCommandTimeoutSeconds.Report, cancellationToken: cancellationToken));

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        await SqlBufferedBulkCopy.WriteAsync(sqlConn, tx, "#IdentitySnapshot",
            distinct.Select(pair => new
            {
                CloudResourceId = Guid.NewGuid(), scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                Provider = (int)provider, ExternalResourceIdNormalized = pair.Key,
                pair.Value.ResourceType, pair.Value.SubscriptionOrAccountId, pair.Value.ResourceGroupOrProject,
                pair.Value.Region, pair.Value.DisplayName,
                FirstSeenSnapshotId = snapshotId, LastSeenSnapshotId = snapshotId,
                FirstSeenUtc = utcNow, LastSeenUtc = utcNow,
            }), cancellationToken);

        // Range locks on the existing unique identity index protect concurrent first sightings.
        const string upsertSql = """
            INSERT INTO dbo.CloudResourceIdentities
                (CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider, ExternalResourceIdNormalized,
                 ResourceType, SubscriptionOrAccountId, ResourceGroupOrProject, Region, DisplayName,
                 FirstSeenSnapshotId, LastSeenSnapshotId, FirstSeenUtc, LastSeenUtc)
            SELECT s.CloudResourceId, s.TenantId, s.WorkspaceId, s.ProjectId, s.Provider, s.ExternalResourceIdNormalized,
                s.ResourceType, s.SubscriptionOrAccountId, s.ResourceGroupOrProject, s.Region, s.DisplayName,
                s.FirstSeenSnapshotId, s.LastSeenSnapshotId, s.FirstSeenUtc, s.LastSeenUtc
            FROM #IdentitySnapshot s
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.CloudResourceIdentities d WITH (UPDLOCK, HOLDLOCK)
                WHERE d.TenantId = s.TenantId AND d.Provider = s.Provider
                  AND d.ExternalResourceIdNormalized = s.ExternalResourceIdNormalized);

            UPDATE d SET LastSeenSnapshotId = s.LastSeenSnapshotId, LastSeenUtc = s.LastSeenUtc,
                ResourceType = COALESCE(s.ResourceType, d.ResourceType),
                SubscriptionOrAccountId = COALESCE(s.SubscriptionOrAccountId, d.SubscriptionOrAccountId),
                ResourceGroupOrProject = COALESCE(s.ResourceGroupOrProject, d.ResourceGroupOrProject),
                Region = COALESCE(s.Region, d.Region), DisplayName = COALESCE(s.DisplayName, d.DisplayName)
            FROM dbo.CloudResourceIdentities d
            INNER JOIN #IdentitySnapshot s ON d.TenantId = s.TenantId AND d.Provider = s.Provider
                AND d.ExternalResourceIdNormalized = s.ExternalResourceIdNormalized;

            SELECT d.CloudResourceId, d.TenantId, d.WorkspaceId, d.ProjectId, d.Provider,
                d.ExternalResourceIdNormalized, d.ResourceType, d.SubscriptionOrAccountId, d.ResourceGroupOrProject,
                d.Region, d.DisplayName, d.FirstSeenSnapshotId, d.LastSeenSnapshotId, d.FirstSeenUtc, d.LastSeenUtc
            FROM dbo.CloudResourceIdentities d
            INNER JOIN #IdentitySnapshot s ON d.TenantId = s.TenantId AND d.Provider = s.Provider
                AND d.ExternalResourceIdNormalized = s.ExternalResourceIdNormalized;
            """;
        IEnumerable<CloudResourceIdentityRecord> identities = await sqlConn.QueryAsync<CloudResourceIdentityRecord>(
            new CommandDefinition(upsertSql, transaction: tx, commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
        Dictionary<string, CloudResourceIdentityRecord> result = identities.ToDictionary(
            identity => identity.ExternalResourceIdNormalized, StringComparer.OrdinalIgnoreCase);
        tx.Commit();
        return result;
    }
}
