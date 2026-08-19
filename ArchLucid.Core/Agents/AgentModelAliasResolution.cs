using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Agents;

/// <summary>Result of resolving a tier and task type to a governed model alias (TB-869).</summary>
public sealed class AgentModelAliasResolution
{
    public AgentModelAliasResolution(string aliasId, LlmModelTier tier, string deploymentName)
    {
        if (string.IsNullOrWhiteSpace(aliasId))
        {
            throw new ArgumentException("Alias id is required.", nameof(aliasId));
        }

        if (string.IsNullOrWhiteSpace(deploymentName))
        {
            throw new ArgumentException("Deployment name is required.", nameof(deploymentName));
        }

        AliasId = aliasId.Trim();
        Tier = tier;
        DeploymentName = deploymentName.Trim();
    }

    public string AliasId
    {
        get;
    }

    public LlmModelTier Tier
    {
        get;
    }

    public string DeploymentName
    {
        get;
    }
}
