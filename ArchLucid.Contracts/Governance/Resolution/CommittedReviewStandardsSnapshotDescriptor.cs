using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>
///     Review bar sealed on the committed golden manifest (TB-2345 item 50) so compare and sponsor
///     surfaces cannot imply a wider specialist scope than the run actually evaluated.
/// </summary>
public sealed class CommittedReviewStandardsSnapshotDescriptor
{
    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    private List<string> policyReferences = [];

    /// <summary>Policy pack references declared on the architecture request at commit time.</summary>
    public List<string> PolicyReferences
    {
        get => policyReferences;
        set => policyReferences = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>True when focused pilot scope token was present on the request policy references.</summary>
    public bool FocusedPilotModeEnabled
    {
        get;
        set;
    }

    /// <summary>Primary cloud target from the architecture request.</summary>
    public string CloudProvider
    {
        get;
        set;
    } = "None";

    private List<string> reviewedQualityDimensions = [];

    /// <summary>Distinct finding categories observed on the committed findings snapshot (proxy for dimensions reviewed).</summary>
    public List<string> ReviewedQualityDimensions
    {
        get => reviewedQualityDimensions;
        set => reviewedQualityDimensions = ContractCollectionDefaults.Coalesce(value);
    }
}
