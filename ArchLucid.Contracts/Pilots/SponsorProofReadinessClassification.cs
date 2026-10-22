namespace ArchLucid.Contracts.Pilots;
/// <summary>
///     Sponsor circulation label for first-value reports — four states derived from the buyer-safe gate and proof checklist.
/// </summary>
public enum SponsorProofReadinessClassification
{
    /// <summary>Structural proof and tenant comparative baseline are green; operators still owe qualitative rows and redaction.</summary>
    Sendable = 0,

    /// <summary>Only comparative ROI baseline posture is weak; capture tenant baselines before dollar or customer-specific claims.</summary>
    NeedsBaseline = 1,

    /// <summary>Demo or seeded tenant — not externally publishable as customer ROI.</summary>
    DemoOnly = 2,

    /// <summary>Hard gaps or non-baseline caveats remain — not sponsor-complete.</summary>
    Incomplete = 3,
}
