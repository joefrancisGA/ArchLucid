namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class AdversarialChallenge
{
    public string ChallengeId
    {
        get;
        set;
    } = null!;

    public string Hypothesis
    {
        get;
        set;
    } = null!;

    public string FalsificationEvidenceNeeded
    {
        get;
        set;
    } = null!;

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
