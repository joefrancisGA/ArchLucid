using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Composes <c>dbo.ContextSnapshots</c> read statements so the ARCH006 scope
///     predicate stays on its own token from <c>ORDER BY</c>. Concatenating a C# raw
///     string that starts with <c>ORDER BY</c> strips the leading newline and glues
///     <c>@ScopeProjectIdORDER</c>, which SQL Server rejects (error 137).
/// </summary>
internal static class ContextSnapshotReadSql
{
    internal static string BuildGetLatest(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"""
                SELECT TOP 1
                    SnapshotId,
                    RunId,
                    ProjectId,
                    CreatedUtc,
                    CanonicalObjectsJson,
                    DeltaSummary,
                    WarningsJson,
                    ErrorsJson,
                    SourceHashesJson
                FROM dbo.ContextSnapshots
                WHERE ProjectId = @ProjectId
                {PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope)}
                ORDER BY CreatedUtc DESC;
                """;
    }

    internal static string BuildGetById(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"""
                SELECT
                    SnapshotId,
                    RunId,
                    ProjectId,
                    CreatedUtc,
                    CanonicalObjectsJson,
                    DeltaSummary,
                    WarningsJson,
                    ErrorsJson,
                    SourceHashesJson
                FROM dbo.ContextSnapshots
                WHERE SnapshotId = @SnapshotId
                {PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope)};
                """;
    }
}
