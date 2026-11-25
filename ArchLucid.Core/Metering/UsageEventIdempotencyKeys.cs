namespace ArchLucid.Core.Metering;

/// <summary>Stable idempotency keys for <see cref="UsageEvent.IdempotencyKey" /> deduplication.</summary>
public static class UsageEventIdempotencyKeys
{
    public const int MaxLength = 256;

    public static string ForLlmTokens(string scopeKey, UsageMeterKind kind)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(scopeKey);

        if (kind is not (UsageMeterKind.LlmPromptTokens or UsageMeterKind.LlmCompletionTokens))
            throw new ArgumentOutOfRangeException(nameof(kind), kind, "Expected an LLM token meter kind.");

        return Truncate($"llm:{scopeKey}:{UsageMeterKindSqlName(kind)}");
    }

    /// <summary>Keys one server-generated API usage event, not its correlation ID.</summary>
    public static string ForApiRequest(Guid eventId)
    {
        if (eventId == Guid.Empty)
            throw new ArgumentException("Expected a nonempty usage event ID.", nameof(eventId));

        return $"api-event:{eventId:N}";
    }

    public static string ForArchitectureRun(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return Truncate($"run:{runId}");
    }

    private static string UsageMeterKindSqlName(UsageMeterKind kind) =>
        kind switch
        {
            UsageMeterKind.LlmPromptTokens => "LlmPromptTokens",
            UsageMeterKind.LlmCompletionTokens => "LlmCompletionTokens",
            _ => kind.ToString()
        };

    private static string Truncate(string value) =>
        value.Length <= MaxLength ? value : value[..MaxLength];
}
