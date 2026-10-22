namespace ArchLucid.Application.Diagnostics;

/// <summary>
///     Validates that the effective agent execution mode can run before <c>Architecture.RunStarted</c> is emitted.
/// </summary>
public interface IAgentExecutionReadinessGuard
{
    Task EnsureReadyForExecuteAsync(CancellationToken cancellationToken = default);
}
