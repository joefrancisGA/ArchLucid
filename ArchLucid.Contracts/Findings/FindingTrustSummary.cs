namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Trust calibration summary for a single finding or explanation, suitable for display
///     in operator UI and sponsor export surfaces.
/// </summary>
/// <param name="Label">The resolved trust label derived from structured finding fields.</param>
/// <param name="ShortReason">
///     A concise, non-alarming explanation of the label, suitable for UI microcopy.
///     Should be short enough to display inline (one sentence or fewer).
/// </param>
public sealed record FindingTrustSummary(FindingTrustLabel Label, string ShortReason);
