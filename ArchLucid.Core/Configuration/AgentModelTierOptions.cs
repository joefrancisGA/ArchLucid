using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>Maps <see cref="Contracts.Common.LlmModelTier" /> to Azure OpenAI deployment names and per-agent defaults.</summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class AgentModelTierOptions
{
    public const string SectionPath = "ArchLucid:AgentModelTiers";

    /// <summary>
    ///     Tenant default tier when no per-agent mapping or task override applies. Names
    ///     <see cref="Contracts.Common.LlmModelTier" /> (e.g. <c>Standard</c>).
    /// </summary>
    public string DefaultTier
    {
        get;
        set;
    } = "Standard";

    /// <summary>When empty, <c>AzureOpenAI:DeploymentName</c> is used.</summary>
    public string? StandardDeploymentName
    {
        get;
        set;
    }

    /// <summary>When empty, <c>AzureOpenAI:DeploymentName</c> is used.</summary>
    public string? PremiumDeploymentName
    {
        get;
        set;
    }

    /// <summary>When empty, <c>AzureOpenAI:DeploymentName</c> is used.</summary>
    public string? EconomyDeploymentName
    {
        get;
        set;
    }

    /// <summary>Optional per-agent-type tier overrides (keys: Topology, Cost, Compliance, Critic).</summary>
    public Dictionary<string, string> AgentTypeTiers
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);
}
