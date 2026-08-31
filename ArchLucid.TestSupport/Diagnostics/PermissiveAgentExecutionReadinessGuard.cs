using ArchLucid.Application.Diagnostics;

namespace ArchLucid.TestSupport.Diagnostics;

/// <summary>Test double that skips execute-time agent readiness validation.</summary>
public sealed class PermissiveAgentExecutionReadinessGuard : IAgentExecutionReadinessGuard
{
    public Task EnsureReadyForExecuteAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
