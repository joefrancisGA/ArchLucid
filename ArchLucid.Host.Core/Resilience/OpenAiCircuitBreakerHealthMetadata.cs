namespace ArchLucid.Host.Core.Resilience;

/// <summary>Stable health-check labels for keyed Azure OpenAI circuit breaker gates.</summary>
public static class OpenAiCircuitBreakerHealthMetadata
{
    public const string Provider = "AzureOpenAI";

    public static string ResolveRole(string gateName) =>
        gateName switch
        {
            OpenAiCircuitBreakerKeys.Completion => "completion",
            OpenAiCircuitBreakerKeys.CompletionFallback => "completion_fallback",
            OpenAiCircuitBreakerKeys.Embedding => "embedding",
            _ => "unknown"
        };
}
