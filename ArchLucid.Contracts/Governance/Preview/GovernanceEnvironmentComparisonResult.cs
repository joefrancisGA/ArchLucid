using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Preview;

/// <summary>
///     Result of a side-by-side comparison between the manifests currently active in two environment slots.
/// </summary>
public sealed class GovernanceEnvironmentComparisonResult
{
    /// <summary>Source environment slot that was compared.</summary>
    public string SourceEnvironment
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Target environment slot that was compared.</summary>
    public string TargetEnvironment
    {
        get;
        set;
    } = string.Empty;

    private List<GovernanceDiffItem> differences = [];

    /// <summary>Diff items between the source and target active manifests.</summary>
    public List<GovernanceDiffItem> Differences
    {
        get => differences;
        set => differences = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> notes = [];

    /// <summary>Advisory notes about the comparison (e.g. no active manifest in one slot).</summary>
    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }
}
