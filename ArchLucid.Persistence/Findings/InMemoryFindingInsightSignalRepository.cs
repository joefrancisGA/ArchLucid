using System.Collections.Concurrent;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Persistence.Findings;

public sealed class InMemoryFindingInsightSignalRepository : IFindingInsightSignalRepository
{
    private readonly ConcurrentDictionary<string, List<StoredSignal>> _signalsByScopeUser = new();

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
