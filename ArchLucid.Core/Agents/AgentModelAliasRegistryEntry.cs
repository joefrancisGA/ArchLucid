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

    /// <summary>Whether completions stay inside the ArchLucid Azure boundary (TB-2109).</summary>
    public AgentModelDataBoundaryKind DataBoundary
    {
        get;
        init;
    } = AgentModelDataBoundaryKind.AzureBoundary;

    /// <summary>Structured-output capability for fail-closed routing (TB-2104).</summary>
    public AgentModelStructuredOutputLevel StructuredOutputLevel
    {
        get;
        init;
    } = AgentModelStructuredOutputLevel.StrictJsonSchema;

    /// <summary>Per-task evaluation evidence snapshot for selection surfaces (TB-2105).</summary>
    public IReadOnlyList<AgentModelCatalogEvaluationRow> TaskEvaluations
    {
        get;
        init;
    } = [];

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
