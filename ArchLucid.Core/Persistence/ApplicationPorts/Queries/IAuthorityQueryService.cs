using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     Read-only façade over authority stores (runs, linked snapshots, golden manifests) for a <see cref="ScopeContext" />
///     .
/// </summary>
/// <remarks>
///     SQL-backed: <see cref="DapperAuthorityQueryService" />; in-memory/tests:
///     <see cref="InMemoryAuthorityQueryService" />.
///     Primary callers: <c>ArchLucid.Api.Controllers.AuthorityQueryController</c>,
///     <c>ArchLucid.Persistence.Advisory.AdvisoryScanRunner</c>,
///     comparison/replay/export/ask controllers and services that need run + manifest data without duplicating repository
///     orchestration.
/// </remarks>
public interface IAuthorityQueryService
{
    /// <summary>
    ///     Lists recent runs for an authority <paramref name="projectId" /> slug (e.g. <c>default</c>), newest first, capped
    ///     by <paramref name="take" />.
    /// </summary>
    /// <param name="scope">Tenant/workspace/project scope (must match stored run rows).</param>
    /// <param name="projectId">Authority project slug, not the scope GUID.</param>
    /// <param name="take">Maximum runs to return.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Summaries with snapshot and manifest ids; may be empty.</returns>
    Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct);

    /// <summary>
    ///     Keyset page of runs for <paramref name="projectId" /> (newest first). When
    ///     <paramref name="cursorCreatedUtc" /> and <paramref name="cursorRunId" /> are both <see langword="null" />, returns
    ///     the first page.
    /// </summary>
    Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct);

    /// <summary>
    ///     Keyset page of runs across all authority project slugs in <paramref name="scope" /> (newest first).
    ///     Use for operator inventory hubs: create maps <c>SystemName</c> onto the run project slug, so listing only
    ///     <c>default</c> misses real reviews.
    /// </summary>
    Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct);

    /// <summary>
    ///     Latest non-archived committed run for <paramref name="projectId" /> within <paramref name="scope" />,
    ///     ordered by linked golden-manifest <c>CreatedUtc</c> descending (SQL <c>TOP 1</c> join on the Dapper path).
    /// </summary>
    /// <returns>The run id, or <see langword="null" /> when no committed run with a golden manifest exists.</returns>
    Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct);

    /// <summary>
    ///     Most recent committed run for <paramref name="projectId" /> strictly before
    ///     <paramref name="currentRunId" /> in dashboard list order (<c>CreatedUtc</c> descending, then run id).
    /// </summary>
    /// <returns>The prior committed summary, or <see langword="null" /> when none exists before the current run.</returns>
    Task<RunSummaryDto?> GetPriorCommittedRunSummaryBeforeCurrentAsync(
        ScopeContext scope,
        Guid currentRunId,
        string projectId,
        DateTime currentCreatedUtc,
        CancellationToken ct);

    /// <summary>Loads a single run’s summary by id within <paramref name="scope" />.</summary>
    /// <returns>The summary, or <see langword="null" /> when the run is missing or out of scope.</returns>
    Task<RunSummaryDto?> GetRunSummaryAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    /// <summary>
    ///     Loads the <see cref="RunRecord" /> and, when ids are present, hydrates context/graph/findings/decision trace,
    ///     golden manifest, and artifact bundle metadata.
    /// </summary>
    /// <returns>Aggregated detail, or <see langword="null" /> when the run is missing or out of scope.</returns>
    /// <remarks>
    ///     Missing child rows (e.g. deleted snapshot) surface as <see langword="null" /> properties on
    ///     <see cref="RunDetailDto" /> rather than failing the whole call.
    ///     The artifact bundle is resolved with <c>GetByManifestIdAsync</c> whenever <see cref="RunRecord.GoldenManifestId" />
    ///     is set;
    ///     <see cref="RunRecord.ArtifactBundleId" /> is optional denormalization and is not required to load the bundle for
    ///     replay/export/detail.
    ///     Default <paramref name="loadArtifactBodies" /> is <see langword="false" /> (TB-2059); download/export paths load
    ///     bodies via <see cref="IArtifactQueryService" /> or pass <see langword="true" /> when inline LOBs are required.
    /// </remarks>
    Task<RunDetailDto?> GetRunDetailAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct,
        bool loadArtifactBodies = false);

    /// <summary>
    ///     First-paint buyer/operator summary path (TB-930): run header + finding coverage metadata without
    ///     context/graph/artifact bodies, full findings <c>PayloadJson</c>, or golden-manifest document.
    /// </summary>
    Task<RunDetailDto?> GetRunDetailForBuyerSummaryAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    /// <summary>
    ///     Export packaging path (TB-931): run header, golden manifest, and authority trace without context/graph,
    ///     findings snapshot, or artifact bundle bodies.
    /// </summary>
    Task<RunDetailDto?> GetRunDetailForExportAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    /// <summary>
    ///     Manifest compare path (TB-931): run header and golden manifest without context/graph, findings snapshot,
    ///     authority trace, or artifact bundle bodies.
    /// </summary>
    Task<RunDetailDto?> GetRunDetailForManifestCompareAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    /// <summary>
    ///     Retrieval indexing outbox path (TB-2055): graph, findings, trace, manifest, and artifact metadata without
    ///     context snapshot, disposition coverage, or artifact bodies (bodies loaded separately for indexing).
    /// </summary>
    Task<RunDetailDto?> GetRunDetailForRetrievalIndexingAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    /// <summary>
    ///     Projects a golden manifest into a compact summary (counts and metadata) without returning the full document.
    /// </summary>
    /// <returns>Summary DTO, or <see langword="null" /> when the manifest id is unknown in <paramref name="scope" />.</returns>
    Task<ManifestSummaryDto?> GetManifestSummaryAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct);
}
