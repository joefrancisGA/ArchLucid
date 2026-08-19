using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>Normalizes audit list rows that omit <see cref="AuditEvent.DataJson"/> (TB-577).</summary>
internal static class AuditEventListProjection
{
    internal static IReadOnlyList<AuditEvent> MaterializeWithoutDataJson(IEnumerable<AuditEvent> rows)
    {
        List<AuditEvent> list = [];

        foreach (AuditEvent row in rows)
            list.Add(WithoutDataJson(row));

        return list;
    }

    internal static AuditEvent WithoutDataJson(AuditEvent row)
    {
        return new AuditEvent
        {
            EventId = row.EventId,
            OccurredUtc = row.OccurredUtc,
            EventType = row.EventType,
            ActorUserId = row.ActorUserId,
            ActorUserName = row.ActorUserName,
            ExplicitActor = row.ExplicitActor,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            RunId = row.RunId,
            ManifestId = row.ManifestId,
            ArtifactId = row.ArtifactId,
            DataJson = "{}",
            CorrelationId = row.CorrelationId,
        };
    }
}
