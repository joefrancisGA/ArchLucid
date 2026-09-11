namespace ArchLucid.Core.InfraEvidence;

/// <summary>Shared constants for human security asset assertions (SA-18).</summary>
public static class SecurityAssetAssertionConstants
{
    public const string AssertionExpirySourceSystem = "ArchLucid.AssetAssertionExpiry";

    public const int MaxDurationDays = 365;

    public const int ActorKeyMaxLength = 256;

    public const int EvidenceReferenceMaxLength = 1024;
}
