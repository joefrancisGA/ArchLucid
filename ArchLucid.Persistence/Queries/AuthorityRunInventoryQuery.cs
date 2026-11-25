using System.Runtime.CompilerServices;

using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

/// <summary>Enumerates authorized run headers before enriching the selected public inventory rows.</summary>
public sealed class AuthorityRunInventoryQuery(
    IRunRepository runs,
    IAgentExecutionTraceRepository traces)
{
    public async IAsyncEnumerable<RunRecord> EnumerateVisibleHeadersAsync(
        ScopeContext scope,
        string? projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        Func<Guid, CancellationToken, Task<bool>> canRead,
        [EnumeratorCancellation] CancellationToken ct)
    {
        while (true)
        {
            RunListPage batch = projectId is null
                ? await runs.ListRecentInScopeKeysetAsync(
                    scope, cursorCreatedUtc, cursorRunId, RunPagination.MaxTake, ct)
                : await runs.ListByProjectKeysetAsync(
                    scope, projectId, cursorCreatedUtc, cursorRunId, RunPagination.MaxTake, ct);

            foreach (RunRecord candidate in batch.Items)
            {
                ct.ThrowIfCancellationRequested();
                if (candidate.RunId != Guid.Empty && await canRead(candidate.RunId, ct))
                    yield return candidate;
            }

            if (!batch.HasMore)
                yield break;

            if (batch.Items.Count == 0)
                throw new InvalidOperationException("Run inventory query returned a continuation without rows.");

            RunRecord last = batch.Items[^1];
            if (last.RunId == Guid.Empty || (last.CreatedUtc == cursorCreatedUtc && last.RunId == cursorRunId))
                throw new InvalidOperationException("Run inventory query did not advance its cursor.");

            cursorCreatedUtc = last.CreatedUtc;
            cursorRunId = last.RunId;
        }
    }

    /// <summary>Applies offsets, page size and continuation lookahead to visible headers.</summary>
    public static async Task<RunListPage> PageVisibleHeadersAsync(
        IAsyncEnumerable<RunRecord> visibleRuns,
        int offset,
        int take,
        CancellationToken ct)
    {
        List<RunRecord> page = new(take);
        await foreach (RunRecord run in visibleRuns.WithCancellation(ct))
        {
            if (offset > 0)
            {
                offset--;
                continue;
            }

            if (page.Count == take)
                return new RunListPage(page, HasMore: true);

            page.Add(run);
        }

        return new RunListPage(page, HasMore: false);
    }

    public async Task<IReadOnlyList<RunSummaryDto>> ProjectSummariesAsync(
        ScopeContext scope,
        IReadOnlyList<RunRecord> authorizedRuns,
        CancellationToken ct)
    {
        List<RunSummaryDto> summaries = authorizedRuns.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, authorizedRuns, traces, ct);
        return summaries;
    }
}
