namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Cooperative cancellation guard for execute orchestration.
/// </summary>
public interface IArchitectureRunExecuteCancellationGuardStage
{
    Task ThrowIfCooperativeCancelRequestedAsync(string runId, CancellationToken cancellationToken);
}
