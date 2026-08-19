using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     A single actor interacting with the system, described by three irreducible axes (ADR 0049 / R1).
/// </summary>
/// <remarks>
///     <para>
///         An <see cref="ActorDescriptor" /> captures <em>who</em> the user is along the three axes
///         established in the foundational debate (R1):
///         <c>(kind × trust-origin × interaction-contract)</c>.
///         None of the three is derivable from the others, and all three together determine the
///         dominant non-functional requirements for that actor's surface.
///     </para>
///     <para>
///         Each descriptor carries an <see cref="Origin" /> flag that records whether the axes were
///         explicitly stated by the user (<see cref="ActorOrigin.Asserted" />) or inferred by
///         ArchLucid from free-text intent (<see cref="ActorOrigin.Inferred" />), together with a
///         <see cref="Confidence" /> score (1–100).  Inferred descriptors lower the trust score of
///         downstream findings in accordance with ADR 0050 / R4.
///     </para>
///     <para>
///         Machine-actor scope discipline: when <see cref="Kind" /> is <see cref="ActorKind.Machine" />,
///         ArchLucid reviews only up to the <see cref="Contract" /> boundary and treats the external
///         system as a black box with a trust label.
///     </para>
/// </remarks>
public sealed class ActorDescriptor
{
    /// <summary>
    ///     Optional human-readable label for this actor role
    ///     (e.g. <c>External customer</c>, <c>Internal ops service</c>).
    ///     Not required for processing; aids readability in the transparency trail.
    /// </summary>
    [JsonPropertyName("label")]
    public string? Label
    {
        get;
        set;
    }

    /// <summary>Whether this actor is a human, a machine, or a shared surface for both.</summary>
    [JsonPropertyName("kind")]
    public ActorKind Kind
    {
        get;
        set;
    }

    /// <summary>Where the actor originates relative to the system's trust boundary.</summary>
    [JsonPropertyName("trustOrigin")]
    public TrustOrigin TrustOrigin
    {
        get;
        set;
    }

    /// <summary>The communication pattern between this actor and the system.</summary>
    [JsonPropertyName("contract")]
    public InteractionContract Contract
    {
        get;
        set;
    }

    /// <summary>
    ///     Whether these axes were explicitly stated by the user
    ///     (<see cref="ActorOrigin.Asserted" />) or inferred from free-text intent
    ///     (<see cref="ActorOrigin.Inferred" />) by ArchLucid.
    ///     Feeds the mandatory transparency trail (ADR 0050 / R4).
    /// </summary>
    [JsonPropertyName("origin")]
    public ActorOrigin Origin
    {
        get;
        set;
    }

    /// <summary>
    ///     Confidence that this descriptor accurately reflects the intended actor (1 = very uncertain,
    ///     100 = explicitly confirmed by the user).  Meaningful only when <see cref="Origin" /> is
    ///     <see cref="ActorOrigin.Inferred" />; set to 100 for <see cref="ActorOrigin.Asserted" />.
    /// </summary>
    [JsonPropertyName("confidence")]
    public int Confidence
    {
        get;
        set;
    } = 100;
}
