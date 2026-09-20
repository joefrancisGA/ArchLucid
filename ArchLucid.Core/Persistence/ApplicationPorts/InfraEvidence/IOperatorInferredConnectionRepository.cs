using ArchLucid.Core.Scoping;
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
        ProjectScopeKey scope,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        OperatorInferredConnectionRecord? record =
            await TryGetByIdAsync(scope.TenantId, connectionId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task UpdateStatusAsync(
        OperatorInferredConnectionRecord record,
        CancellationToken cancellationToken = default);

    Task UpdateStatusInScopeAsync(
        ProjectScopeKey scope,
        OperatorInferredConnectionMutation mutation,
        CancellationToken cancellationToken = default);
}

public sealed record OperatorInferredConnectionMutation
{
    public required Guid ConnectionId { get; init; }
    public required OperatorInferredConnectionStatus Status { get; init; }
    public Guid? FromCloudResourceId { get; init; }
    public string? ToArmId { get; init; }
    public Guid? ToCloudResourceId { get; init; }
    public string? ToCatalog { get; init; }
    public string? ActorKey { get; init; }
    public required DateTime UpdatedUtc { get; init; }
}
