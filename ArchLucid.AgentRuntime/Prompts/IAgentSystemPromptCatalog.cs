using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>Resolves versioned system prompt templates for LLM-backed agents.</summary>
public interface IAgentSystemPromptCatalog
{
    /// <summary>Returns the canonical system prompt and metadata for <paramref name="agentType" />.</summary>
    /// <param name="tenantId">When set with <paramref name="runId" />, enables stable prompt variant selection.</param>
    /// <param name="runId">When set with <paramref name="tenantId" />, enables stable prompt variant selection.</param>
    /// <exception cref="InvalidOperationException">When <paramref name="agentType" /> has no registered template (e.g. Cost).</exception>
    Task<ResolvedSystemPrompt> ResolveAsync(
        AgentType agentType,
        Guid? tenantId = null,
        Guid? runId = null,
        CancellationToken cancellationToken = default);
}
