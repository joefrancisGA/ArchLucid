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

    public static string ForApiRequest(string traceIdentifier)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceIdentifier);

        return Truncate($"api:{traceIdentifier}");
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
