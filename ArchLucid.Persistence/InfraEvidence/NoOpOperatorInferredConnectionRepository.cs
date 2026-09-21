namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpOperatorInferredConnectionRepository : IOperatorInferredConnectionRepository
{
    public Task UpsertProposalsAsync(
        IReadOnlyList<OperatorInferredConnectionRecord> records,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<OperatorInferredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<OperatorInferredConnectionRecord?>(null);

    public Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<OperatorInferredConnectionRecord>>([]);

    public Task UpdateStatusAsync(
        OperatorInferredConnectionRecord record,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
