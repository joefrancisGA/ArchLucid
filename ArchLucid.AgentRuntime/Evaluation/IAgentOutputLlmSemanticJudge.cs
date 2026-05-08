using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Optional Azure OpenAI rubric judge abstraction for composition + tests.</summary>
public interface IAgentOutputLlmSemanticJudge
{
    Task<AgentOutputLlmJudgeParsedResult?> TryJudgeAsync(
        string traceId,
        string parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken);
}
