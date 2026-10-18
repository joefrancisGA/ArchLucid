using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using System.Data;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventoryDiffRepository
{
    public async Task<IReadOnlyList<AzureInventoryChangeRecord>> ListChangesByDiffIdAndCloudResourceIdsAsync(
        ScopeContext scope,
        Guid diffId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(cloudResourceIds);

        List<Guid> distinctIds = cloudResourceIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (diffId == Guid.Empty || distinctIds.Count == 0)
            return [];

        const string sql = """
                           SELECT ChangeId, DiffId, SnapshotAId, SnapshotBId, CloudResourceId, AzureResourceId,
                                  ChangeType, Property, OldValue, NewValue, RiskClassification,
                                  ArchitectureSignificance, SecuritySignificance, Confidence, EvidenceReference,
                                  ProvenanceKind, ChangedByDisplayName, ChangedByKind
                           FROM dbo.AzureInventoryChanges
                           WHERE TenantId = @TenantId
                             AND DiffId = @DiffId
                             AND CloudResourceId IN @CloudResourceIds
                           ORDER BY AzureResourceId, ChangeType, Property;
                           """;

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ChangeRow> rows = await conn.QueryAsync<ChangeRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    DiffId = diffId,
                    CloudResourceIds = distinctIds,
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => new AzureInventoryChangeRecord
            {
                ChangeId = r.ChangeId,
                DiffId = r.DiffId,
                SnapshotAId = r.SnapshotAId,
                SnapshotBId = r.SnapshotBId,
                CloudResourceId = r.CloudResourceId,
                AzureResourceId = r.AzureResourceId,
                ChangeType = (AzureInventoryChangeType)r.ChangeType,
                Property = r.Property,
                OldValue = r.OldValue,
                NewValue = r.NewValue,
                RiskClassification = r.RiskClassification,
                ArchitectureSignificance = r.ArchitectureSignificance,
                SecuritySignificance = r.SecuritySignificance,
                Confidence = r.Confidence,
                EvidenceReference = r.EvidenceReference,
                ProvenanceKind = (ProvenanceKind)r.ProvenanceKind,
                ChangedByDisplayName = r.ChangedByDisplayName,
                ChangedByKind = r.ChangedByKind,
            })
            .ToList();
    }
}
