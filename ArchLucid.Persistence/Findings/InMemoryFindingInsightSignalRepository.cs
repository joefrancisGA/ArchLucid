using System.Collections.Concurrent;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Findings;

public sealed class InMemoryFindingInsightSignalRepository(IAuthorityQueryService authorityQueryService)
    : IFindingInsightSignalRepository
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly ConcurrentDictionary<string, List<StoredSignal>> _signalsByScopeUser = new();

    private readonly ConcurrentDictionary<(Guid TenantId, Guid RunId, string FindingId), byte> _noveltySignalsByFinding =
        new();

    /// <inheritdoc />
    public Task<FindingInsightSignalInsertResult> TryInsertAsync(
        FindingInsightSignalSubmission submission,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(submission);

        string scopeUserKey = BuildScopeUserKey(
            submission.TenantId,
            submission.RunId,
            submission.FindingId,
            submission.UserId);

        List<StoredSignal> signals = _signalsByScopeUser.GetOrAdd(scopeUserKey, static _ => []);

        lock (signals)
        {
            StoredSignal? existing = signals.FirstOrDefault(signal => signal.Kind == submission.Kind);

            if (existing is not null)
            {
                return Task.FromResult(new FindingInsightSignalInsertResult
                {
                    SignalId = existing.SignalId,
                    Created = false
                });
            }

            StoredSignal created = new(Guid.NewGuid(), submission.Kind);
            signals.Add(created);

            if (submission.Kind == FindingInsightSignalKind.DidNotThinkOfThat)
            {
                _noveltySignalsByFinding[(submission.TenantId, submission.RunId, submission.FindingId.Trim())] = 0;
            }

            return Task.FromResult(new FindingInsightSignalInsertResult
            {
                SignalId = created.SignalId,
                Created = true
            });
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        string scopeUserKey = BuildScopeUserKey(tenantId, runId, findingId, userId);

        if (!_signalsByScopeUser.TryGetValue(scopeUserKey, out List<StoredSignal>? signals))
            return Task.FromResult<IReadOnlyList<FindingInsightSignalKind>>([]);

        lock (signals)
        {
            IReadOnlyList<FindingInsightSignalKind> kinds = signals
                .Select(static signal => signal.Kind)
                .ToList();

            return Task.FromResult(kinds);
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
        ScopeContext scope,
        DateTime fromUtc,
        DateTime toUtcExclusive,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (toUtcExclusive <= fromUtc)
        {
            return [];
        }

        List<EngineInsightNoveltyRateAggregation.DecisionGradeEmission> emissions = [];
        List<EngineInsightNoveltyRateAggregation.NoveltySignalRef> noveltySignals = [];

        Guid? cursorRunId = null;
        DateTime? cursorCreatedUtc = null;
        const int pageSize = 100;

        while (true)
        {
            (IReadOnlyList<RunSummaryDto> items, bool hasMore) = await _authorityQueryService.ListRunsInScopeKeysetAsync(
                scope,
                cursorCreatedUtc,
                cursorRunId,
                pageSize,
                cancellationToken);

            foreach (RunSummaryDto run in items)
            {
                RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, run.RunId, cancellationToken);

                FindingsSnapshot? snapshot = detail?.FindingsSnapshot;

                if (snapshot is null)
                {
                    continue;
                }

                if (snapshot.CreatedUtc < fromUtc || snapshot.CreatedUtc >= toUtcExclusive)
                {
                    continue;
                }

                foreach (Finding finding in snapshot.Findings)
                {
                    if (!IsDecisionGrade(finding))
                    {
                        continue;
                    }

                    emissions.Add(new EngineInsightNoveltyRateAggregation.DecisionGradeEmission(
                        run.RunId,
                        finding.FindingId,
                        finding.EngineType));

                    if (_noveltySignalsByFinding.ContainsKey((scope.TenantId, run.RunId, finding.FindingId)))
                    {
                        noveltySignals.Add(new EngineInsightNoveltyRateAggregation.NoveltySignalRef(
                            run.RunId,
                            finding.FindingId));
                    }
                }
            }

            if (!hasMore || items.Count == 0)
            {
                break;
            }

            RunSummaryDto last = items[^1];
            cursorRunId = last.RunId;
            cursorCreatedUtc = last.CreatedUtc;
        }

        return EngineInsightNoveltyRateAggregation.BuildRows(emissions, noveltySignals);
    }

    internal static bool IsDecisionGrade(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification == FindingClassification.ChecklistCoverage)
        {
            return false;
        }

        if (finding.Classification == FindingClassification.DecisionGradeFinding)
        {
            return true;
        }

        if (finding.Treatment == FindingTreatment.DemoteToChecklist)
        {
            return false;
        }

        return true;
    }

    private static string BuildScopeUserKey(Guid tenantId, Guid runId, string findingId, string userId)
    {
        return string.Join(
            '|',
            tenantId.ToString("D"),
            runId.ToString("D"),
            findingId.Trim(),
            userId.Trim());
    }

    private sealed record StoredSignal(Guid SignalId, FindingInsightSignalKind Kind);
}
