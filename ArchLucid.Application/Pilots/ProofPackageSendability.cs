namespace ArchLucid.Application.Pilots;

/// <summary>
///     Sponsor / buyer-facing sendability for reference-evidence and sponsor artifacts (orthogonal to
///     <see cref="PilotBuyerSafeEvidencePublishingTier" />, which is publishing posture).
/// </summary>
public enum ProofPackageSendability
{
    /// <summary>Do not distribute externally (e.g. demo tenant gate).</summary>
    NotSendable = 0,

    /// <summary>May be shared with explicit caveat disclosure (structural gaps listed).</summary>
    SendableWithCaveats = 1,

    /// <summary>No gate gaps detected for the checked dimensions; still requires human qualitative review.</summary>
    Sendable = 2
}
