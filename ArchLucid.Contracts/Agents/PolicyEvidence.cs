using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Represents a single governance policy entry included in an <see cref="AgentEvidencePackage" />.
///     Agents use this information to evaluate compliance and apply required security controls.
///     Well-known <see cref="PolicyId" /> values are defined in
///     <c>ArchLucid.Application.Evidence.BuiltInPolicyIds</c>.
/// </summary>
public sealed class PolicyEvidence
{
    /// <summary>
    ///     Stable identifier for the policy. Must not change between builds;
    ///     agents may reference this value in their reasoning output.
    /// </summary>
    public string PolicyId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Short display name for the policy.</summary>
    public string Title
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Concise description of the policy's intent and scope.</summary>
    public string Summary
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Mandatory security controls that compliant architectures must implement
    ///     in order to satisfy this policy.
    /// </summary>
    private List<string> requiredControls = [];

    public List<string> RequiredControls
    {
        get => requiredControls;
        set => requiredControls = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Classification tags for filtering and grouping (e.g., <c>security</c>, <c>networking</c>).</summary>
    private List<string> tags = [];

    public List<string> Tags
    {
        get => tags;
        set => tags = ContractCollectionDefaults.Coalesce(value);
    }
}
