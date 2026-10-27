using ArchLucid.Application;
using ArchLucid.Contracts.Abstractions.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Default resolver that returns the same <see cref = "IAgentExecutor"/> for all known execution modes.
///     All modes (<c>Current</c>, <c>Deterministic</c>, <c>Replay</c>) are dispatched to the single
///     injected executor; mode-specific behavior is handled by the executor or its upstream callers.
/// </summary>
public sealed class DefaultAgentExecutorResolver(IAgentExecutor currentExecutor) : IAgentExecutorResolver
{
    /// <inheritdoc/>
    public IAgentExecutor Resolve(string executionMode)
    {
        ExecutionModes.EnsureKnown(executionMode);
        return currentExecutor;
    }
}
