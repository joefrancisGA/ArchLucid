namespace ArchLucid.Core.Agents;

/// <summary>One customer-facing model alias bound to a deployment and approved task list (TB-869).</summary>
public sealed class AgentModelAliasRegistryEntry
{
    public required string AliasId
    {
        get;
        init;
    }

    public required string ProviderConnectionKind
    {
        get;
        init;
    }

    public required string DeploymentName
    {
        get;
        init;
    }

    public required IReadOnlyList<string> CapabilityTags
    {
        get;
        init;
    }

    public required IReadOnlyList<string> ApprovedTaskTypes
    {
        get;
        init;
    }

    public bool IsTaskApproved(string taskType)
    {
        if (string.IsNullOrWhiteSpace(taskType))
        {
            return false;
        }

        foreach (string approved in ApprovedTaskTypes)
        {
            if (string.Equals(approved, taskType, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
