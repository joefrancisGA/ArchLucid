using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     A single item the user explicitly stated during intake (ADR 0050 / R4).
/// </summary>
/// <remarks>
///     Appears in <see cref="TransparencyTrail.Asserted" />.  Examples: the confirmed business
///     outcome, a user-corrected actor descriptor, an explicitly answered MUST question.
///     These entries earn the liability stance — ArchLucid may attribute errors to the user
///     only when asserted items are visible in the trail.
/// </remarks>
public sealed class AssertedTrailEntry
{
    /// <summary>
    ///     Stable identifier for the asserted item (e.g. <c>businessOutcome</c>,
    ///     <c>actor.external-customer</c>, <c>q-encryption-at-rest</c>).
    /// </summary>
    [JsonPropertyName("key")]
    public string Key
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The value the user stated or confirmed for <see cref="Key" />.</summary>
    [JsonPropertyName("value")]
    public string Value
    {
        get;
        set;
    } = string.Empty;
}
