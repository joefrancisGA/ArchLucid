using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>Relational remediation assignment read/write for <c>dbo.FindingRecords</c> (TB-395).</summary>
public interface IFindingRecordRemediationAssignmentRepository
{
    Task<bool> TryUpdateAssignmentAsync(
        Guid runId,
        string findingId,
        ScopeContext scope,
        string? assignedToUserId,
        DateTimeOffset? remediationDueUtc,
        CancellationToken ct);
}
