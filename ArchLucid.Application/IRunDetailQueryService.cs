using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application;

/// <summary>
///     Single query path for assembling the canonical <see cref="ArchitectureRunDetail" /> aggregate.
///     All features that need to read run state — export, compare, governance, analysis — should
///     use this service rather than making their own bespoke repository calls.
/// </summary>
public interface IRunDetailQueryService
{
    /// <summary>
    ///     Loads the full <see cref="ArchitectureRunDetail" /> for <paramref name="runId" />:
    ///     run record, agent tasks and results, golden manifest (if committed), and decision traces.
    ///     Returns <see langword="null" /> when no run exists with that id.
    /// </summary>
    Task<ArchitectureRunDetail?> GetRunDetailAsync(
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Operator authority enrich path (TB-2119): same enrichment as <see cref="GetRunDetailAsync"/> but agent
    ///     results load via rollup projection — no bare <c>ResultJson</c> LOB SELECT.
    /// </summary>
    Task<ArchitectureRunDetail?> GetRunDetailForOperatorEnrichAsync(
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Internal rollup/compare path (TB-931 / TB-2053): run header, rollup-projected agent results, and golden
    ///     manifest without tasks, decision traces, mute/trust enrichment, or LLM cost slices. Agent results omit
    ///     full <c>ResultJson</c> LOBs (reasoning / topology additions).
    /// </summary>
    Task<ArchitectureRunDetail?> GetRunDetailForRollupAsync(
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     ROI history/trends/portfolio path (TB-2054): same projection as
    ///     <see cref="GetRunDetailForRollupAsync"/> plus finding mute flags when a findings snapshot exists.
    ///     Avoids N× full <see cref="GetRunDetailAsync"/> LOB loads while preserving mute honesty.
    /// </summary>
    Task<ArchitectureRunDetail?> GetRunDetailForRoiAsync(
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Returns lightweight <see cref="RunSummary" /> entries for the most recent runs,
    ///     ordered descending by creation time. Suitable for list/dashboard views.
    /// </summary>
    Task<IReadOnlyList<RunSummary>> ListRunSummariesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Keyset-paged run summaries for the current scope (newest first). Provide <paramref name="cursor" /> from the prior
    ///     response&apos;s next cursor token.
    /// </summary>
    Task<(IReadOnlyList<RunSummary> Items, bool HasMore, string? NextCursor)> ListRunSummariesKeysetAsync(
        string? cursor,
        int take,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Offset-paged run summaries for the current scope (newest first).
    /// </summary>
    Task<(IReadOnlyList<RunSummary> Items, bool HasMore)> ListRunSummariesOffsetAsync(
        int offset,
        int limit,
        CancellationToken cancellationToken = default);
}
