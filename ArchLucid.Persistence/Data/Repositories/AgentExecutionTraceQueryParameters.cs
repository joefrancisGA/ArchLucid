using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper parameter objects for the scoped read paths over <c>dbo.AgentExecutionTraces</c>. Every read joins through
///     Runs for tenant isolation, so the scope triple travels with the run key on all of them.
/// </summary>
internal static class AgentExecutionTraceQueryParameters
{
    /// <summary>Upper bound on a single trace page, matching the API's own page-size ceiling.</summary>
    private const int MaxPageSize = 500;

    public static object ForRun(ScopeContext scope, string runId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            RunId = SqlRunIdMapping.ToSqlRunId(runId),
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };
    }

    public static object ForRunPage(ScopeContext scope, string runId, int offset, int limit)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            RunId = SqlRunIdMapping.ToSqlRunId(runId),
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Offset = Math.Max(0, offset),
            Limit = Math.Clamp(limit, 1, MaxPageSize),
        };
    }

    /// <remarks>
    ///     Run ids are passed as a <see cref="Guid" /> array because <c>List&lt;string&gt;</c> is globally mapped to JSON by
    ///     <c>ListStringTypeHandler</c>, which suppresses Dapper's IN-list expansion.
    /// </remarks>
    public static object ForRuns(ScopeContext scope, IReadOnlyList<string> runIds)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runIds);

        return new
        {
            RunIds = ToSqlRunIds(runIds),
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };
    }

    /// <summary>Multi-run variant that also filters on the shared LLM completion deployment name prefix.</summary>
    public static object ForRunsWithLlmFallbackPrefix(ScopeContext scope, IReadOnlyList<string> runIds)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runIds);

        return new
        {
            RunIds = ToSqlRunIds(runIds),
            PrefixPattern = AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "%",
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };
    }

    /// <summary>
    ///     Trims, drops blanks, and de-duplicates the caller's run ids. The returned order is the lookup order used to
    ///     shape multi-run results, so callers must group against this list rather than their own input.
    /// </summary>
    public static List<string> NormalizeRunIds(IEnumerable<string> runIds)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        return runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static Guid[] ToSqlRunIds(IReadOnlyList<string> runIds) =>
        runIds.Select(SqlRunIdMapping.ToSqlRunId).ToArray();
}
