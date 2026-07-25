namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Identity for a cached LLM JSON completion (per-process cache).
/// </summary>
/// <param name="AgentType">Telemetry / provider label (e.g. azure-openai, simulator).</param>
/// <param name="ModelName">Deployment or model label.</param>
/// <param name="PromptHashHex">SHA-256 hex of the full prompt (system and user).</param>
/// <param name="Simulator">When true, entries are isolated from non-simulator completions.</param>
/// <param name="ScopePartition">Empty, or tenant/workspace/project partition string.</param>
/// <param name="PromptVersion">Prompt template / catalog version (TB-940 bust dimension).</param>
/// <param name="SchemaVersion">Agent-result schema version label (TB-940 bust dimension).</param>
public readonly record struct LlmCompletionCacheKey(
    string AgentType,
    string ModelName,
    string PromptHashHex,
    bool Simulator,
    string ScopePartition,
    string PromptVersion = "none",
    string SchemaVersion = "none");
