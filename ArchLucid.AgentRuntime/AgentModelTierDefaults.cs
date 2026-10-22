using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>Built-in per-agent tier defaults applied when configuration does not override them.</summary>
public static class AgentModelTierDefaults
{
    /// <summary>
    ///     Default agent-type tier mappings for GPT-5.6 routing:
    ///     Topology/Cost → Economy (Luna); Compliance → Standard (Terra); Critic/Judge → Premium (Sol).
    /// </summary>
    public static IReadOnlyDictionary<string, string> DefaultAgentTypeTiers { get; } =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Topology"] = nameof(LlmModelTier.Economy),
            ["Cost"] = nameof(LlmModelTier.Economy),
            ["Compliance"] = nameof(LlmModelTier.Standard),
            ["Critic"] = nameof(LlmModelTier.Premium),
            [InsightDensityJudgeAgentTypeNames.Judge] = nameof(LlmModelTier.Premium)
        };

    /// <summary>Applies built-in defaults without overwriting explicit configuration.</summary>
    public static void ApplyDefaults(AgentModelTierOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        foreach (KeyValuePair<string, string> entry in DefaultAgentTypeTiers)
            options.AgentTypeTiers.TryAdd(entry.Key, entry.Value);
    }
}
