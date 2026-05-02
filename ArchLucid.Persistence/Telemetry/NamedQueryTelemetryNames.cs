using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Persistence.Telemetry;

/// <summary>
///     Allowlist-aligned names for <see cref="ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds" />
///     (TB-003). Must stay in sync with <c>tests/performance/query-allowlist.json</c>.
/// </summary>
internal static class NamedQueryTelemetryNames
{
    public const string GetRunsByTenantId = "GetRunsByTenantId";

    public const string ListRunsByProject = "ListRunsByProject";

    public const string ListRunsByProjectKeyset = "ListRunsByProjectKeyset";

    public const string ListRunsRecentInScopeKeyset = "ListRunsRecentInScopeKeyset";

    public const string GetRunByScopedId = "GetRunByScopedId";

    public const string AppendAuditEvent = "AppendAuditEvent";

    public const string ListAuditEventsByScope = "ListAuditEventsByScope";

    public const string ListAuditEventsFiltered = "ListAuditEventsFiltered";

    public const string GetFindingsSnapshotById = "GetFindingsSnapshotById";

    public const string GetGoldenManifestById = "GetGoldenManifestById";
}
