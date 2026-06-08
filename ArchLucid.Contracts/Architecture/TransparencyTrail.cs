using System.Text.Json.Serialization;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Mandatory provenance record of what was asserted, inferred, and skipped during intake (ADR 0050 / R4).
/// </summary>
/// <remarks>
///     <para>
///         The transparency trail is a <em>mandatory output</em> on every verdict — not optional polish.
///         It is the precondition that earns the liability stance ("if ArchLucid gets it wrong, the user
///         got it wrong") because it makes every non-user-originated input visible and attributable.
///     </para>
///     <para>
///         This type is intentionally separate from <c>ManifestDocument.Assumptions</c> (flat strings
///         on the committed manifest) and from <see cref="ArchitectureRunProvenanceGraph" /> (structural
///         linkage graph).  The trail documents <em>intake provenance</em> and will later serialize into
///         the manifest / provenance output surfaces (TB-034) without replacing them.
///     </para>
/// </remarks>
public sealed class TransparencyTrail
{
    /// <summary>Items the user explicitly stated or confirmed.</summary>
    [JsonPropertyName("asserted")]
    public List<AssertedTrailEntry> Asserted
    {
        get;
        set;
    } = [];

    /// <summary>Items ArchLucid inferred on the user's behalf, each with a confidence score.</summary>
    [JsonPropertyName("inferred")]
    public List<InferredTrailEntry> Inferred
    {
        get;
        set;
    } = [];

    /// <summary>Elicitation questions offered but not answered before the verdict was produced.</summary>
    [JsonPropertyName("skipped")]
    public List<SkippedQuestionTrailEntry> Skipped
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Returns <see langword="true" /> when at least one skipped question was MUST-tier.
    ///     Useful for surfacing under-specification in export and UI renderers.
    /// </summary>
    public bool HasSkippedMustQuestions =>
        Skipped.Exists(static s => s.Tier == ElicitationQuestionTier.Must);

    /// <summary>
    ///     Returns <see langword="true" /> when every inferred entry has a confidence in the valid 1–100 range.
    /// </summary>
    public bool HasValidInferredConfidences =>
        Inferred.TrueForAll(static i => i.Confidence is >= 1 and <= 100);
}
