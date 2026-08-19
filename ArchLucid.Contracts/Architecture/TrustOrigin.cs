using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Where the actor originates from relative to the system's trust boundary (ADR 0049 / R1).
/// </summary>
/// <remarks>
///     Trust origin is not derivable from <see cref="ActorKind" />: an employee and an anonymous
///     visitor are both <see cref="ActorKind.Human" /> but architecturally opposite — one may access
///     private data stores over a VPN, the other must be treated as untrusted.  Collapsing both
///     into a single actor silently drops a trust boundary.
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TrustOrigin
{
    /// <summary>
    ///     The actor is inside the organization's trust perimeter
    ///     (employee, ops team, internal service).  Typically authenticated via corporate IdP
    ///     and subject to internal network controls.
    /// </summary>
    Internal,

    /// <summary>
    ///     The actor is outside the organization but is a known, identified party
    ///     (partner, B2B customer, contractor with a dedicated account).
    ///     Subject to explicit authentication and scoped authorisation.
    /// </summary>
    External,

    /// <summary>
    ///     The actor is anonymous or self-registered with no pre-existing trust relationship
    ///     (consumer-web user, unauthenticated API caller, public webhook receiver).
    ///     Must be treated as untrusted by default.
    /// </summary>
    PublicAnonymous,
}
