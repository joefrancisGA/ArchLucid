namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Optional <see cref="Models.GraphNode.Properties" /> keys on the context snapshot root node
///     that scope topology coverage expectations for downstream finding engines.
/// </summary>
public static class ContextGraphPropertyKeys
{
    public const string RequiredCapabilities = "requiredCapabilities";

    public const string TopologyHints = "topologyHints";

    public const string Constraints = "constraints";

    /// <summary>Pipe-separated topology categories from the prior committed context snapshot.</summary>
    public const string PriorTopologyCategories = "priorTopologyCategories";

    /// <summary>Pipe-separated requirement names from the prior committed context snapshot.</summary>
    public const string PriorRequirementNames = "priorRequirementNames";

    /// <summary>Pipe-separated topology categories added by tenant policy packs (additive floor).</summary>
    public const string PolicyExpectedTopologyCategories = "policyExpectedTopologyCategories";

    /// <summary>Pipe-separated security control families added by tenant policy packs.</summary>
    public const string PolicyExpectedSecurityControlFamilies = "policyExpectedSecurityControlFamilies";

    /// <summary>Pipe-separated requirement themes added by tenant policy packs.</summary>
    public const string PolicyExpectedRequirementThemes = "policyExpectedRequirementThemes";

    /// <summary>When <c>true</c>, a monthly budget cap is required by policy.</summary>
    public const string PolicyCostRequireBudgetCap = "policyCostRequireBudgetCap";

    /// <summary>Policy override for cost-breach severity when a breach would already emit.</summary>
    public const string PolicyCostBreachSeverity = "policyCostBreachSeverity";

    public const string Assumptions = "assumptions";

    public const string Actors = "actors";

    public const string QualityAttribute = "qualityAttribute";

    public const string FailureModeNote = "failureModeNote";
}
