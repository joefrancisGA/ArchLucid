using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceService
{
    Task<RemediationInstanceOperationResult> CreateFromMatchAsync(
        ScopeContext scope,
        Guid findingId,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> RunPreflightAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid inventorySnapshotId,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> ApproveAsync(
        ScopeContext scope,
        Guid instanceId,
        string approverActorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> AssignWaveAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid waveId,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> ExecuteAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid inventorySnapshotId,
        string actorKey,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> VerifyAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid verificationSnapshotId,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceOperationResult> CloseAsync(
        ScopeContext scope,
        Guid instanceId,
        string actorKey,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationInstanceOperationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? InstanceId
    {
        get;
        init;
    }

    public RemediationInstanceStatus? Status
    {
        get;
        init;
    }

    public IReadOnlyList<string> Blockers
    {
        get;
        init;
    } = [];

    public string? ErrorMessage
    {
        get;
        init;
    }
}
