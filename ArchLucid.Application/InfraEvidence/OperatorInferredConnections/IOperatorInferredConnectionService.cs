using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

public interface IOperatorInferredConnectionService
{
    Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListQuestionnaireBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<OperatorInferredConnectionMutationResult> ConfirmAsync(
        ScopeContext scope,
        Guid snapshotId,
        OperatorInferredConnectionConfirmRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<OperatorInferredConnectionMutationResult> DismissAsync(
        ScopeContext scope,
        Guid snapshotId,
        OperatorInferredConnectionDismissRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);
}

public sealed class OperatorInferredConnectionConfirmRequest
{
    public Guid ConnectionId
    {
        get;
        init;
    }

    public Guid? FromCloudResourceId
    {
        get;
        init;
    }

    public Guid? ToCloudResourceId
    {
        get;
        init;
    }

    public string? ToArmId
    {
        get;
        init;
    }

    public string? ToCatalog
    {
        get;
        init;
    }
}

public sealed class OperatorInferredConnectionDismissRequest
{
    public Guid ConnectionId
    {
        get;
        init;
    }
}

public sealed class OperatorInferredConnectionMutationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}
