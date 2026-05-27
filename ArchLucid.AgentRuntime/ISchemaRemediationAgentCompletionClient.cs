namespace ArchLucid.AgentRuntime;

/// <summary>
///     Schema-repair LLM completions without the primary Polly retry stack (TB-043). Same Azure deployment as economy
///     tier; bounded to remediation attempts inside <c>LlmAgentSchemaCompletion</c>.
/// </summary>
public interface ISchemaRemediationAgentCompletionClient : IAgentCompletionClient;
