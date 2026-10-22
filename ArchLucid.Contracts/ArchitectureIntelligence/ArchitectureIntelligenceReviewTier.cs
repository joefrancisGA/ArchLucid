namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>
/// Explicit review depth for ArchitectureIntelligence unit economics (TB-1992).
/// Caps estimated token spend before the closed-loop run starts.
/// </summary>
public enum ArchitectureIntelligenceReviewTier
{
    /// <summary>Short pilot / smoke path — lowest token ceiling.</summary>
    Trial = 0,

    /// <summary>Default operator review depth.</summary>
    Standard = 1,

    /// <summary>Deep multi-lane review — highest token ceiling.</summary>
    Deep = 2,
}
