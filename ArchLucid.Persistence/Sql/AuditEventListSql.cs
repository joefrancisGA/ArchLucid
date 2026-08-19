namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Audit list/search projection without <c>DataJson</c> (TB-577).
/// </summary>
internal static class AuditEventListSql
{
    /// <summary>Columns for admin list/search; omit heavy <c>DataJson</c> payload.</summary>
    public const string SelectColumnsWithoutDataJson = """
                                                       EventId, OccurredUtc, EventType,
                                                       ActorUserId, ActorUserName,
                                                       TenantId, WorkspaceId, ProjectId,
                                                       RunId, ManifestId, ArtifactId,
                                                       CorrelationId
                                                       """;
}
