using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Requests;

public sealed class DraftArchitectureRequestResponse
{
    private string[] suggestedConstraints = [];

    public string[] SuggestedConstraints
    {
        get => suggestedConstraints;
        set => suggestedConstraints = ContractCollectionDefaults.CoalesceArray(value);
    }

    private string[] suggestedCapabilities = [];

    public string[] SuggestedCapabilities
    {
        get => suggestedCapabilities;
        set => suggestedCapabilities = ContractCollectionDefaults.CoalesceArray(value);
    }

    private string[] suggestedAssumptions = [];

    public string[] SuggestedAssumptions
    {
        get => suggestedAssumptions;
        set => suggestedAssumptions = ContractCollectionDefaults.CoalesceArray(value);
    }

    private string[] topologyHints = [];

    public string[] TopologyHints
    {
        get => topologyHints;
        set => topologyHints = ContractCollectionDefaults.CoalesceArray(value);
    }

    private string[] securityBaselineHints = [];

    public string[] SecurityBaselineHints
    {
        get => securityBaselineHints;
        set => securityBaselineHints = ContractCollectionDefaults.CoalesceArray(value);
    }

    /// <summary>
    /// One concise failure-mode and recovery note for structured-brief operations fields (optional).
    /// </summary>
    public string? SuggestedFailureModeNote
    {
        get;
        set;
    }

    /// <summary>
    ///     Confirmed assumptions that explicit overview evidence contradicts (empty when none or check skipped).
    /// </summary>
    private List<EvidenceContradictedBriefAssumption> evidenceContradictedAssumptions = [];

    public List<EvidenceContradictedBriefAssumption> EvidenceContradictedAssumptions
    {
        get => evidenceContradictedAssumptions;
        set => evidenceContradictedAssumptions = ContractCollectionDefaults.Coalesce(value);
    }
}
