namespace ArchLucid.AgentRuntime;

/// <summary>
///     Domain validation failures for <see cref="AgentResult" /> payloads after deserialization (distinct from schema
///     violations and malformed JSON).
/// </summary>
public sealed class AgentResultValidationException(string message) : InvalidOperationException(message);
