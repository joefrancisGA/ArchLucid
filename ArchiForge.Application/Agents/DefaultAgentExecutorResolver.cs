using ArchiForge.AgentSimulator.Services;

namespace ArchiForge.Application.Agents;

public sealed class DefaultAgentExecutorResolver : IAgentExecutorResolver
{
    private readonly IAgentExecutor _currentExecutor;

    public DefaultAgentExecutorResolver(IAgentExecutor currentExecutor)
    {
        _currentExecutor = currentExecutor;
    }

    public IAgentExecutor Resolve(string executionMode)
    {
        return _currentExecutor;
    }
}
