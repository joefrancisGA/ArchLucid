using ArchiForge.AgentSimulator.Services;

namespace ArchiForge.Application.Agents;

public sealed class DefaultAgentExecutorResolver(IAgentExecutor currentExecutor) : IAgentExecutorResolver
{
    private static readonly HashSet<string> _knownModes =
        new(StringComparer.OrdinalIgnoreCase) { "Current", "Deterministic", "Replay" };

    public IAgentExecutor Resolve(string executionMode)
    {
        if (!_knownModes.Contains(executionMode))
        {
            throw new ArgumentException(
                $"Unknown execution mode '{executionMode}'. Supported modes: {string.Join(", ", _knownModes)}.",
                nameof(executionMode));
        }

        return currentExecutor;
    }
}
