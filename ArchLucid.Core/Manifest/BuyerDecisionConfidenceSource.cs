namespace ArchLucid.Core.Manifest;

/// <summary>Buyer-facing confidence provenance labels (three-value collapse per assessment resolved decision).</summary>
public static class BuyerDecisionConfidenceSource
{
    public const string EvidenceBacked = "Evidence-backed";

    public const string ModelAssisted = "Model-assisted";

    public const string Unknown = "Unknown";

    public const string NotComputed = "Not computed";

    public const string NotStored = "Confidence source was not stored.";

    public const string Unrecognized = "Persisted confidence source was not recognized.";
}
