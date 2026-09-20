using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperatorInferredConnectionRepository
{
    Task UpsertProposalsAsync(
        IReadOnlyList<OperatorInferredConnectionRecord> records,
        CancellationToken cancellationToken = default);

    Task<OperatorInferredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    async Task<OperatorInferredConnectionRecord?> TryGetByIdInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        OperatorInferredConnectionRecord? record =
            await TryGetByIdAsync(tenantId, connectionId, cancellationToken);

        return record is not null
               && record.WorkspaceId == workspaceId
               && record.ProjectId == projectId
            ? record
            : null;
    }

    Task UpdateStatusAsync(
        OperatorInferredConnectionRecord record,
        CancellationToken cancellationToken = default);
}
