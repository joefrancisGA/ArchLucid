using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Records whether an <see cref="ActorDescriptor" />'s axes were explicitly stated by the user
///     or inferred by ArchLucid from free-text intent (ADR 0049 / ADR 0050 / R4).
/// </summary>
/// <remarks>
///     This flag is the per-actor realisation of the broader asserted-vs-inferred labeling
///     mandated by the transparency trail in ADR 0050.  An <see cref="Inferred" /> actor
///     lowers the confidence of any finding that depends on that actor's trust boundary,
///     and the actor appears in the <c>Inferred[]</c> section of the trail output.
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ActorOrigin
{
    /// <summary>
    ///     The actor's axes were explicitly confirmed by the user.
    ///     <see cref="ActorDescriptor.Confidence" /> is 100.
    /// </summary>
    Asserted,

    /// <summary>
    ///     The actor's axes were inferred by ArchLucid from free-text intent and have not
    ///     yet been confirmed.  <see cref="ActorDescriptor.Confidence" /> reflects the
    ///     degree of certainty in the inference.
    /// </summary>
    Inferred,
}
