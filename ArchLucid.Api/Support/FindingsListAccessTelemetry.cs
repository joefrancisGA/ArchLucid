using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Support;

/// <summary>
///     Structured application logging for HTTP surfaces that hydrate <see cref="ArchLucid.Persistence.Queries.RunDetailDto.FindingsSnapshot" />.
///     Complements deferred durable <c>FindingsListAccessed</c> audit events (see audit matrix).
/// </summary>
internal static class FindingsListAccessTelemetry
{
    public static void LogFindingSnapshotExpose(
        ILogger logger,
        ScopeContext scope,
        Guid runId,
        string surface,
        int findingCount)
    {
        if (logger is null)
            throw new ArgumentNullException(nameof(logger));

        if (scope is null)
            throw new ArgumentNullException(nameof(scope));

        if (string.IsNullOrWhiteSpace(surface))
            throw new ArgumentException("Surface identifier is required.", nameof(surface));

        logger.LogInformation(
            "Finding list telemetry (application logs only; not durable audit). Surface={Surface} RunId={RunId} TenantId={TenantId} WorkspaceId={WorkspaceId} ProjectId={ProjectId} FindingCount={FindingCount}",
            surface.Trim(),
            runId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            findingCount);
    }
}
