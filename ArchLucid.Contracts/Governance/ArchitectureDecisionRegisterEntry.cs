using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>One durable manifest decision in the decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterEntry
{
    public string DecisionId
    {
        get;
        init;
    } = string.Empty;

    public Guid ManifestId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string Category
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string SelectedOption
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public double? Confidence
    {
        get;
        init;
    }

    public string? ConfidenceSource
    {
        get;
        init;
    }

    /// <summary>Buyer-facing collapse of <see cref="ConfidenceSource" /> (Evidence-backed, Model-assisted, Unknown).</summary>
    public string? BuyerConfidenceSource
    {
        get;
        init;
    }

    public DateTimeOffset RecordedAtUtc
    {
        get;
        init;
    }

    private IReadOnlyList<string> supportingFindingIds = [];

    public IReadOnlyList<string> SupportingFindingIds
    {
        get => supportingFindingIds;
        init => supportingFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
