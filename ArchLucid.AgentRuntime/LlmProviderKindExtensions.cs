namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared classifier for LLM provider tokens excluded from tenant budget enforcement (simulators / test stubs).
/// </summary>
internal static class LlmProviderKindExtensions
{
    internal static bool IsExcludedFromBudgetTracking(this string? providerKind)
    {
        if (string.IsNullOrWhiteSpace(providerKind))
            return false;

        return providerKind.Equals("simulator", StringComparison.OrdinalIgnoreCase)
               || providerKind.Equals("fake", StringComparison.OrdinalIgnoreCase)
               || providerKind.Equals("echo", StringComparison.OrdinalIgnoreCase);
    }
}
