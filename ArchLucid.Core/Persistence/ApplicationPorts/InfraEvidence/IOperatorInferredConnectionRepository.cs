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

    async Task UpdateStatusInScopeAsync(
        ProjectScopeKey scope,
        OperatorInferredConnectionMutation mutation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mutation);

        OperatorInferredConnectionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ConnectionId, cancellationToken);

        if (current is null)
            return;

        await UpdateStatusAsync(mutation.ApplyTo(current), cancellationToken);
    }
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

    public OperatorInferredConnectionRecord ApplyTo(OperatorInferredConnectionRecord source)
    {
        ArgumentNullException.ThrowIfNull(source);

        if (source.ConnectionId != ConnectionId)
            throw new InvalidOperationException("Inferred connection mutation id does not match the source record.");

        return new OperatorInferredConnectionRecord
        {
            ConnectionId = source.ConnectionId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            SnapshotId = source.SnapshotId,
            Status = Status,
            Source = source.Source,
            RuleName = source.RuleName,
            QuestionText = source.QuestionText,
            FromArmId = source.FromArmId,
            FromLabel = source.FromLabel,
            FromCloudResourceId = FromCloudResourceId,
            ToHost = source.ToHost,
            ToCatalog = ToCatalog,
            ToArmId = ToArmId,
            ToCloudResourceId = ToCloudResourceId,
            SettingName = source.SettingName,
            SourceFileFormat = source.SourceFileFormat,
            ActorKey = ActorKey,
            ProposalPayloadHashSha256 = source.ProposalPayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = UpdatedUtc,
        };
    }
}
