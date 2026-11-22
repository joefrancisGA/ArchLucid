using System.Reflection;

using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SqlAuditEvidenceSnapshotRepositoryUtcMappingTests
{
    [Fact]
    public void MapItem_restores_utc_kind_without_shifting_sql_datetime2_collection_time()
    {
        Type repositoryType = typeof(SqlAuditEvidenceSnapshotRepository);
        Type rowType = repositoryType.GetNestedType("ItemRow", BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("Snapshot item row type was not found.");
        object row = Activator.CreateInstance(rowType, nonPublic: true)
            ?? throw new InvalidOperationException("Snapshot item row could not be created.");
        DateTime collected = new(2026, 9, 4, 17, 45, 21, DateTimeKind.Unspecified);
        PropertyInfo collectedProperty = rowType.GetProperty(nameof(AuditEvidenceSnapshotItemRecord.CollectedUtc))
            ?? throw new InvalidOperationException("Snapshot item collection timestamp was not found.");
        collectedProperty.SetValue(row, collected);

        MethodInfo map = repositoryType.GetMethod("MapItem", BindingFlags.NonPublic | BindingFlags.Static)
            ?? throw new InvalidOperationException("Snapshot item mapper was not found.");
        AuditEvidenceSnapshotItemRecord mapped = (AuditEvidenceSnapshotItemRecord)(map.Invoke(null, [row])
            ?? throw new InvalidOperationException("Snapshot item mapper returned null."));

        Assert.Equal(collected.Ticks, mapped.CollectedUtc.Ticks);
        Assert.Equal(DateTimeKind.Utc, mapped.CollectedUtc.Kind);
    }
}
