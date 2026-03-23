namespace ArchiForge.Decisioning.Governance.Resolution;

/// <summary>
/// Describes a governance conflict detected during merge (multiple packs defining the same item, or disagreeing on a value).
/// </summary>
/// <remarks>
/// <para>Not every multi-candidate situation is a conflict: duplicate dictionary values do not produce a <c>ValueConflict</c>.</para>
/// <para>Audit: API may emit <c>GovernanceConflictDetected</c> when this list is non-empty.</para>
/// </remarks>
public class GovernanceConflictRecord
{
    /// <summary>Facet name (matches <see cref="GovernanceResolutionDecision.ItemType"/>).</summary>
    public string ItemType { get; set; } = default!;

    /// <summary>Item key within the facet.</summary>
    public string ItemKey { get; set; } = default!;

    /// <summary>E.g. <c>DuplicateDefinition</c> or <c>ValueConflict</c>.</summary>
    public string ConflictType { get; set; } = default!;

    /// <summary>Operator-facing explanation.</summary>
    public string Description { get; set; } = default!;

    /// <summary>All candidates that participated in the conflict.</summary>
    public List<GovernanceResolutionCandidate> Candidates { get; set; } = [];
}
