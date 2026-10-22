namespace ArchLucid.Contracts.Trust;

/// <summary>Normalized labels for trust-evidence card rows (matches operator-facing wording).</summary>
public static class TrustEvidenceStatusValue
{
    public const string Available = "Available";

    public const string Missing = "Missing";

    public const string NotApplicable = "Not applicable";

    public const string DemoOnly = "Demo-only";

    public const string LowConfidence = "Low confidence";
}
