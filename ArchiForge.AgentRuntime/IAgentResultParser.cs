using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;

namespace ArchiForge.AgentRuntime;

public interface IAgentResultParser
{
    AgentResult ParseAndValidate(
        string json,
        string expectedRunId,
        string expectedTaskId,
        AgentType expectedAgentType);
}
