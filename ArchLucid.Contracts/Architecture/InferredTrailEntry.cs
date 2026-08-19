using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     A single item ArchLucid filled on the user's behalf during intake (ADR 0050 / R4).
/// </summary>
/// <remarks>
///     Appears in <see cref="TransparencyTrail.Inferred" />.  Each entry carries a
///     <see cref="Confidence" /> score (1–100) that lowers downstream trust when the inference
///     proves wrong.  Inferred actors from <see cref="ActorSet.InferredActors" /> map here.
/// </remarks>
public sealed class InferredTrailEntry
{
    /// <summary>
    ///     Stable identifier for the inferred item (e.g. <c>actor.partner-webhook</c>,
    ///     <c>scale.requestsPerSecond</c>).
    /// </summary>
    [JsonPropertyName("key")]
    public string Key
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The value ArchLucid inferred for <see cref="Key" />.</summary>
    [JsonPropertyName("value")]
    public string Value
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Confidence that this inference is correct (1 = very uncertain, 100 = high certainty).
    ///     Must be in the range 1–100 inclusive.
    /// </summary>
    [JsonPropertyName("confidence")]
    public int Confidence
    {
        get;
        set;
    }
}
