using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Dapper parameter objects for the scoped <c>dbo.Runs</c> read paths: project lists, recent-in-scope lists, their
///     keyset and offset continuations, and the status-filtered counts.
/// </summary>
/// <remarks>
///     Keyset pages request one extra row so the caller can detect a further page without a second COUNT query; that is
///     why <see cref="Fetch" /> is the clamped page size plus one.
/// </remarks>
internal static class RunListQueryParameters
{
    /// <summary>Ceiling shared by the unpaged list paths, which read directly rather than through a cursor.</summary>
    private const int MaxUnpagedTake = 200;

    /// <summary>Applied when a project list caller passes no usable take; picker lists default to the full ceiling.</summary>
    private const int DefaultProjectListTake = 20;

    public static object ForProjectList(ScopeContext scope, string projectSlug, int take)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            ProjectSlug = projectSlug,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Take = ClampTake(take, DefaultProjectListTake)
        };
    }

    public static object ForProjectKeysetPage(
        ScopeContext scope,
        string projectSlug,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            ProjectSlug = projectSlug,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Fetch = Fetch(take),
            CursorCreatedUtc = cursorCreatedUtc,
            CursorRunId = cursorRunId
        };
    }

    public static object ForRecentInScope(ScopeContext scope, int take)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Take = ClampTake(take, MaxUnpagedTake)
        };
    }

    public static object ForRecentInScopeKeysetPage(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Fetch = Fetch(take),
            CursorCreatedUtc = cursorCreatedUtc,
            CursorRunId = cursorRunId
        };
    }

    public static object ForRecentInScopeOffsetPage(ScopeContext scope, int offset, int limit)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Offset = RunPagination.NormalizeOffset(offset),
            Fetch = RunPagination.ClampLimit(limit) + 1
        };
    }

    public static object ForLatestGraphAtOrBefore(ScopeContext scope, string authorityProjectSlug, DateTime asOfUtc)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            AuthorityProjectSlug = authorityProjectSlug,
            AsOfUtc = DateTime.SpecifyKind(asOfUtc, DateTimeKind.Utc)
        };
    }

    public static object ForLatestCommittedByManifestCreatedUtc(ScopeContext scope, string authorityProjectSlug)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            AuthorityProjectSlug = authorityProjectSlug,
            CommittedStatus = nameof(ArchitectureRunStatus.Committed)
        };
    }

    public static object ForPriorCommittedRunBeforeCurrent(
        ScopeContext scope,
        string authorityProjectSlug,
        Guid currentRunId,
        DateTime currentCreatedUtc)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            AuthorityProjectSlug = authorityProjectSlug,
            CurrentRunId = currentRunId,
            CurrentCreatedUtc = DateTime.SpecifyKind(currentCreatedUtc, DateTimeKind.Utc),
            CommittedStatus = nameof(ArchitectureRunStatus.Committed)
        };
    }

    /// <summary>
    ///     "Active" is defined by exclusion: any run not committed, failed, or quality-rejected still occupies the request's
    ///     concurrency allowance.
    /// </summary>
    public static object ForActiveRunCountByArchitectureRequest(ScopeContext scope, string architectureRequestId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ArchitectureRequestId = architectureRequestId.Trim(),
            CommittedStatus = nameof(ArchitectureRunStatus.Committed),
            FailedStatus = nameof(ArchitectureRunStatus.Failed),
            QualityRejectedStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
        };
    }

    /// <summary>Page size plus the probe row used to answer "is there more?".</summary>
    public static int Fetch(int take) => RunPagination.ClampTake(take) + 1;

    private static int ClampTake(int take, int fallbackWhenUnset) =>
        Math.Clamp(take <= 0 ? fallbackWhenUnset : take, 1, MaxUnpagedTake);
}
