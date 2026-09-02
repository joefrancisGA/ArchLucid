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

    /// <summary>Canonical context fingerprint at graph write time (wave-2 reuse guard).</summary>
    public const string ContextCanonicalFingerprint = "contextCanonicalFingerprint";

    /// <summary>κ content fingerprint at graph write time.</summary>
    public const string KnowledgeModelFingerprint = "knowledgeModelFingerprint";

    /// <summary>Pinned architecture version evaluated by this review.</summary>
    public const string ArchitectureVersionId = "architectureVersionId";

    /// <summary>Prior pinned architecture version for cross-run diff engines.</summary>
    public const string PriorArchitectureVersionId = "priorArchitectureVersionId";

    /// <summary>Prior committed graph snapshot id for typed cross-run prior.</summary>
    public const string PriorGraphSnapshotId = "priorGraphSnapshotId";

    /// <summary>Pipe-separated enabled policy pack ids in force for this findings pass.</summary>
    public const string EnabledPolicyPackIds = "enabledPolicyPackIds";

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
