using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class AdversarialChallenge
{
    private string challengeId = string.Empty;

    public string ChallengeId
    {
        get => challengeId;
        set => challengeId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string hypothesis = string.Empty;

    public string Hypothesis
    {
        get => hypothesis;
        set => hypothesis = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string falsificationEvidenceNeeded = string.Empty;

    public string FalsificationEvidenceNeeded
    {
        get => falsificationEvidenceNeeded;
        set => falsificationEvidenceNeeded = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Recorded read-only probe. Older and unstructured challenges may omit it.</summary>
    public InventoryFalsificationProbe? InventoryProbe { get; set; }

    public double Confidence
    {
        get;
        set;
    }

    public AdversarialLane Lane
    {
        get;
        set;
    } = AdversarialLane.AdversarialChallenge;

    public bool Suppressed
    {
        get;
        set;
    }

    public string? SuppressionReason
    {
        get;
        set;
    }

    /// <summary>Finding challenged by this row when the challenge targets a specific defect (TB-2340 item 45).</summary>
    public string? SourceFindingId
    {
        get;
        set;
    }
}