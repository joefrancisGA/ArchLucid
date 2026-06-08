using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     The primary nature of an actor that interacts with the system under review (ADR 0049 / R1).
/// </summary>
/// <remarks>
///     <para>
///         ArchLucid does not prefer human over machine — both are valid primary actors.
///         The value of making this axis explicit is that it parameterizes the dominant
///         non-functional requirements:
///     </para>
///     <list type="bullet">
///         <item>
///             <description>
///                 <see cref="Human" /> — latency measured in seconds, interactive authN (sessions / MFA),
///                 accessibility requirements, consent / PII handling, bursty low-volume traffic.
///             </description>
///         </item>
///         <item>
///             <description>
///                 <see cref="Machine" /> — throughput and concurrency, service authN (mTLS / client-credentials),
///                 idempotency, retry / back-off, contract versioning, strict SLAs, no UX concerns.
///             </description>
///         </item>
///         <item>
///             <description>
///                 <see cref="Both" /> — systems with genuinely dual human + machine surfaces
///                 (e.g. an API consumed by a UI and by partner integrations) that share a trust boundary
///                 and cannot be cleanly separated into two distinct actors.
///             </description>
///         </item>
///     </list>
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ActorKind
{
    /// <summary>The actor is a human being using the system directly.</summary>
    Human,

    /// <summary>The actor is an automated system or service.</summary>
    Machine,

    /// <summary>The system serves both human and machine actors on the same surface.</summary>
    Both,
}
