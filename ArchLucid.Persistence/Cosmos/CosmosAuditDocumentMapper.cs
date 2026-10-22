using System.Globalization;

using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Maps between <see cref="AuditEvent" /> and Cosmos <see cref="AuditEventDocument" /> shapes.</summary>
internal static class CosmosAuditDocumentMapper
{
    internal static AuditEventDocument ToDocument(AuditEvent auditEvent)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        return new AuditEventDocument
        {
            Id = auditEvent.EventId.ToString("D"),
            TenantId = auditEvent.TenantId.ToString("D"),
            WorkspaceId = auditEvent.WorkspaceId.ToString("D"),
            ProjectId = auditEvent.ProjectId.ToString("D"),
            OccurredUtc = CosmosAuditFilterPredicateBuilder.FormatUtcIso(auditEvent.OccurredUtc),
            EventType = auditEvent.EventType,
            ActorUserId = auditEvent.ActorUserId,
            ActorUserName = auditEvent.ActorUserName,
            ExplicitActor = auditEvent.ExplicitActor,
            RunId = auditEvent.RunId?.ToString("D"),
            ManifestId = auditEvent.ManifestId?.ToString("D"),
            ArtifactId = auditEvent.ArtifactId?.ToString("D"),
            DataJson = string.IsNullOrEmpty(auditEvent.DataJson) ? "{}" : auditEvent.DataJson,
            CorrelationId = auditEvent.CorrelationId
        };
    }

    internal static AuditEvent ToEvent(AuditEventDocument doc)
    {
        ArgumentNullException.ThrowIfNull(doc);

        return new AuditEvent
        {
            EventId = Guid.Parse(doc.Id, CultureInfo.InvariantCulture),
            OccurredUtc = DateTime.Parse(doc.OccurredUtc, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
                .ToUniversalTime(),
            EventType = doc.EventType,
            ActorUserId = doc.ActorUserId,
            ActorUserName = doc.ActorUserName,
            ExplicitActor = doc.ExplicitActor,
            TenantId = Guid.Parse(doc.TenantId, CultureInfo.InvariantCulture),
            WorkspaceId = Guid.Parse(doc.WorkspaceId, CultureInfo.InvariantCulture),
            ProjectId = Guid.Parse(doc.ProjectId, CultureInfo.InvariantCulture),
            RunId = string.IsNullOrEmpty(doc.RunId) ? null : Guid.Parse(doc.RunId, CultureInfo.InvariantCulture),
            ManifestId =
                string.IsNullOrEmpty(doc.ManifestId) ? null : Guid.Parse(doc.ManifestId, CultureInfo.InvariantCulture),
            ArtifactId =
                string.IsNullOrEmpty(doc.ArtifactId) ? null : Guid.Parse(doc.ArtifactId, CultureInfo.InvariantCulture),
            DataJson = string.IsNullOrEmpty(doc.DataJson) ? "{}" : doc.DataJson,
            CorrelationId = doc.CorrelationId
        };
    }
}
