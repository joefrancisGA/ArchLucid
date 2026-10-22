using System.Collections.Concurrent;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class InMemoryVerifiedRemediationControlAssociationRepository
    : IVerifiedRemediationControlAssociationRepository
{
    private readonly ConcurrentDictionary<string, VerifiedRemediationControlAssociationRecord> records = new();

    public Task<VerifiedRemediationControlAssociationRecord> UpsertAsync(
        ProjectScopeKey scope,
        VerifiedRemediationControlAssociationRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();
        VerifiedRemediationControlAssociationRules.EnsureWritable(scope, record);

        string key = VerifiedRemediationControlAssociationRules.BuildKey(record);
        VerifiedRemediationControlAssociationRecord stored = this.records.AddOrUpdate(
            key,
            record,
            (_, existing) => VerifiedRemediationControlAssociationRules.Touch(existing, record.UpdatedUtc));

        return Task.FromResult(stored);
    }

    public Task<VerifiedRemediationControlAssociationRecord?> TryGetAsync(
        ProjectScopeKey scope,
        Guid associationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        VerifiedRemediationControlAssociationRecord? record = this.records.Values.FirstOrDefault(candidate =>
            candidate.AssociationId == associationId
            && scope.Matches(candidate.TenantId, candidate.WorkspaceId, candidate.ProjectId));

        return Task.FromResult(record);
    }

    public Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByInstanceAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> matches = this.records.Values
            .Where(candidate =>
                candidate.InstanceId == instanceId
                && scope.Matches(candidate.TenantId, candidate.WorkspaceId, candidate.ProjectId))
            .OrderByDescending(candidate => candidate.UpdatedUtc)
            .ThenBy(candidate => candidate.AssociationId)
            .ToArray();

        return Task.FromResult(matches);
    }

    public Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByControlAndVerificationSnapshotIdsAsync(
        ProjectScopeKey scope,
        Guid controlId,
        IReadOnlyList<Guid> verificationSnapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(verificationSnapshotIds);
        cancellationToken.ThrowIfCancellationRequested();

        if (controlId == Guid.Empty || verificationSnapshotIds.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<VerifiedRemediationControlAssociationRecord>>([]);
        }

        HashSet<Guid> linkedSnapshotIds = verificationSnapshotIds
            .Where(candidate => candidate != Guid.Empty)
            .ToHashSet();

        if (linkedSnapshotIds.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<VerifiedRemediationControlAssociationRecord>>([]);
        }

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> matches = this.records.Values
            .Where(candidate =>
                candidate.ControlId == controlId
                && linkedSnapshotIds.Contains(candidate.VerificationSnapshotId)
                && scope.Matches(candidate.TenantId, candidate.WorkspaceId, candidate.ProjectId))
            .OrderByDescending(candidate => candidate.UpdatedUtc)
            .ThenBy(candidate => candidate.AssociationId)
            .ToArray();

        return Task.FromResult(matches);
    }
}
