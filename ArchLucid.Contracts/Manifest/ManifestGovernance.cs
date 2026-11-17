using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Governance metadata attached to a <see cref="GoldenManifest" />, capturing compliance
///     requirements, policy constraints, required controls, and risk/cost classifications
///     for the resolved architecture.
/// </summary>
public sealed class ManifestGovernance
{
    /// <summary>Compliance framework or regulatory tags applicable to this architecture (e.g. <c>ISO27001</c>, <c>SOC2</c>).</summary>
    private List<string> complianceTags = [];

    public List<string> ComplianceTags
    {
        get => complianceTags;
        set => complianceTags = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Policy constraint strings that the architecture must satisfy.</summary>
    private List<string> policyConstraints = [];

    public List<string> PolicyConstraints
    {
        get => policyConstraints;
        set => policyConstraints = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Cross-cutting security and operational controls required across all components.</summary>
    private List<string> requiredControls = [];

    public List<string> RequiredControls
    {
        get => requiredControls;
        set => requiredControls = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Risk tier for this architecture (e.g. <c>Low</c>, <c>Moderate</c>, <c>High</c>). Schema default <c>Moderate</c> is not a stored reviewer classification.</summary>
    public string RiskClassification
    {
        get;
        set;
    } = "Moderate";

    /// <summary>Cost tier for this architecture (e.g. <c>Low</c>, <c>Moderate</c>, <c>High</c>). Schema default <c>Moderate</c> is not a stored reviewer classification.</summary>
    public string CostClassification
    {
        get;
        set;
    } = "Moderate";
}
