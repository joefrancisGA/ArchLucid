namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     The set of all actors that interact with the system under review (ADR 0049 / R11).
/// </summary>
/// <remarks>
///     <para>
///         Real systems almost always have <em>more than one</em> actor (e.g. an external human
///         customer, an internal ops user, and a machine webhook caller).  Modelling the system
///         as having a single actor silently drops trust boundaries and attack surfaces.
///     </para>
///     <para>
///         ArchLucid infers the actor set from free-text intent and presents it as a pre-filled
///         guess for the user to confirm or correct (<em>inferred-then-confirmed</em>, never a blank
///         form).  The highest-value confirmation question is always <em>"are there other kinds of
///         users I'm missing?"</em> — because getting the <see cref="Actors" /> count wrong is worse
///         than getting a single actor's axes wrong.
///     </para>
///     <para>
///         Each <see cref="ActorDescriptor" /> in <see cref="Actors" /> carries an
///         <see cref="ActorOrigin" /> and <see cref="ActorDescriptor.Confidence" /> score so that
///         unconfirmed actors flow into the mandatory transparency trail (ADR 0050 / R4) as
///         inferred items.
///     </para>
/// </remarks>
public sealed class ActorSet
{
    /// <summary>
    ///     The distinct actors identified for this system.  Must contain at least one entry before
    ///     a draft may be admitted (ADR 0048 — the admission gate requires ≥1 actor + ≥1 functional
    ///     outcome).
    /// </summary>
    public List<ActorDescriptor> Actors
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Returns <see langword="true" /> when the set contains at least one actor, satisfying the
    ///     minimum-to-admit requirement from ADR 0048.
    /// </summary>
    public bool MeetsAdmissionMinimum => Actors.Count > 0;

    /// <summary>
    ///     Returns all actors whose <see cref="ActorDescriptor.Origin" /> is
    ///     <see cref="ActorOrigin.Inferred" />.  These must appear in the transparency
    ///     trail's <c>Inferred[]</c> section (ADR 0050 / R4).
    /// </summary>
    public IEnumerable<ActorDescriptor> InferredActors =>
        Actors.Where(static a => a.Origin == ActorOrigin.Inferred);

    /// <summary>
    ///     Returns all actors whose <see cref="ActorDescriptor.Origin" /> is
    ///     <see cref="ActorOrigin.Asserted" />.
    /// </summary>
    public IEnumerable<ActorDescriptor> AssertedActors =>
        Actors.Where(static a => a.Origin == ActorOrigin.Asserted);
}
