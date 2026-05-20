using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

/// <summary>Built-in per-agent tier defaults applied when configuration does not override them.</summary>
public static class AgentModelTierDefaults
{
    /// <summary>Default agent-type tier mappings (Topology/Critic → Premium).</summary>
    public static IReadOnlyDictionary<string, string> DefaultAgentTypeTiers { get; } =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Topology"] = nameof(LlmModelTier.Premium),
            ["Critic"] = nameof(LlmModelTier.Premium)
        };

    /// <summary>Applies built-in defaults without overwriting explicit configuration.</summary>
    public static void ApplyDefaults(AgentModelTierOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        foreach (KeyValuePair<string, string> entry in DefaultAgentTypeTiers)
            options.AgentTypeTiers.TryAdd(entry.Key, entry.Value);
    }
}
