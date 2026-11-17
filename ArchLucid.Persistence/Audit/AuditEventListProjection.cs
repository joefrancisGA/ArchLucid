using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>Copies audit rows, optionally omitting <see cref="AuditEvent.DataJson"/> from list results.</summary>
internal static class AuditEventListProjection
{
    internal static IReadOnlyList<AuditEvent> MaterializeWithoutDataJson(IEnumerable<AuditEvent> rows)
    {
        List<AuditEvent> list = [];

        foreach (AuditEvent row in rows)
            list.Add(Copy(row, includeDataJson: false));

        return list;
    }

    internal static AuditEvent Copy(AuditEvent row, bool includeDataJson = true)
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
            DataJson = includeDataJson ? row.DataJson : "{}",
            CorrelationId = row.CorrelationId,
        };
    }
}
