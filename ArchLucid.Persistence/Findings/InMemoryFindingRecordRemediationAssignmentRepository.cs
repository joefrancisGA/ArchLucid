using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Findings;

/// <summary>In-memory / storage-off: remediation assignment updates are unsupported.</summary>
public sealed class InMemoryFindingRecordRemediationAssignmentRepository : IFindingRecordRemediationAssignmentRepository
{
    public Task<bool> TryUpdateAssignmentAsync(
        Guid runId,
        string findingId,
        ScopeContext scope,
        string? assignedToUserId,
        DateTimeOffset? remediationDueUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(false);
    }
}
