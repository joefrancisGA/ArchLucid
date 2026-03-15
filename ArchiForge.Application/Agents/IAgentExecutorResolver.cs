using ArchiForge.AgentSimulator.Services;

namespace ArchiForge.Application.Agents;

public interface IAgentExecutorResolver
{
    IAgentExecutor Resolve(string executionMode);
}
