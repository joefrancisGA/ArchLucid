namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>
///     Propagates the active customer Azure OpenAI provider connection id to trace persistence (TB-872).
/// </summary>
public static class TenantAzureOpenAiProviderConnectionAmbient
{
    private static readonly AsyncLocal<string?> CurrentConnectionId = new();

    public static void Set(string? providerConnectionId)
    {
        if (string.IsNullOrWhiteSpace(providerConnectionId))
        {
            CurrentConnectionId.Value = null;

            return;
        }

        CurrentConnectionId.Value = providerConnectionId.Trim();
    }

    public static string? TryPeek() => CurrentConnectionId.Value;

    public static string? TryConsume()
    {
        string? connectionId = CurrentConnectionId.Value;
        CurrentConnectionId.Value = null;

        return connectionId;
    }
}
