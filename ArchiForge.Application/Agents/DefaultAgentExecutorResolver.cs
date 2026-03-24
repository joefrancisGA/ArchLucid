using ArchiForge.AgentSimulator.Services;

namespace ArchiForge.Application.Agents;

public sealed class DefaultAgentExecutorResolver(IAgentExecutor currentExecutor) : IAgentExecutorResolver
{
    private static readonly HashSet<string> KnownModes =
        new(StringComparer.OrdinalIgnoreCase) { "Current", "Deterministic", "Replay" };

    public IAgentExecutor Resolve(string executionMode)
    {
        if (!KnownModes.Contains(executionMode))
        {
            throw new ArgumentException(
                $"Unknown execution mode '{executionMode}'. Supported modes: {string.Join(", ", KnownModes)}.",
                nameof(executionMode));
        }

        return currentExecutor;
    }
}
