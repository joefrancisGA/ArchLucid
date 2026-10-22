namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Ambient prompt/schema version labels folded into <see cref="LlmCompletionCacheKey" /> (TB-940 bust dimensions).
/// </summary>
public static class LlmCompletionCacheKeyAmbient
{
    private static readonly AsyncLocal<string?> PromptVersionLocal = new();
    private static readonly AsyncLocal<string?> SchemaVersionLocal = new();

    /// <summary>Current prompt catalog / template version, or <c>none</c>.</summary>
    public static string CurrentPromptVersion => Normalize(PromptVersionLocal.Value);

    /// <summary>Current agent-result schema version label, or <c>none</c>.</summary>
    public static string CurrentSchemaVersion => Normalize(SchemaVersionLocal.Value);

    /// <summary>Pushes ambient versions for the duration of the returned scope.</summary>
    public static IDisposable Push(string? promptVersion, string? schemaVersion)
    {
        string? previousPrompt = PromptVersionLocal.Value;
        string? previousSchema = SchemaVersionLocal.Value;

        PromptVersionLocal.Value = promptVersion;
        SchemaVersionLocal.Value = schemaVersion;

        return new PopScope(previousPrompt, previousSchema);
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "none";

        return value.Trim().Replace(":", "_", StringComparison.Ordinal);
    }

    private sealed class PopScope(string? previousPrompt, string? previousSchema) : IDisposable
    {
        private bool _disposed;

        public void Dispose()
        {
            if (_disposed)
                return;

            _disposed = true;
            PromptVersionLocal.Value = previousPrompt;
            SchemaVersionLocal.Value = previousSchema;
        }
    }
}
