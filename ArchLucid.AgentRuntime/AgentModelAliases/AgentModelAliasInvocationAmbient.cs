namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>
///     Propagates the resolved customer-facing model alias from the tier router to trace persistence (TB-869).
/// </summary>
public static class AgentModelAliasInvocationAmbient
{
    private static readonly AsyncLocal<string?> CurrentAlias = new();

    public static void Set(string aliasId)
    {
        if (string.IsNullOrWhiteSpace(aliasId))
        {
            CurrentAlias.Value = null;

            return;
        }

        CurrentAlias.Value = aliasId.Trim();
    }

    public static string? TryPeek()
    {
        return CurrentAlias.Value;
    }

    public static string? TryConsume()
    {
        string? alias = CurrentAlias.Value;
        CurrentAlias.Value = null;

        return alias;
    }
}
