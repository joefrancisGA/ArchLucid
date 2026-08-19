using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     The communication pattern between the actor and the system (ADR 0049 / R1).
/// </summary>
/// <remarks>
///     The interaction contract is not derivable from <see cref="ActorKind" /> or
///     <see cref="TrustOrigin" />.  It shapes the dominant reliability and latency
///     requirements, the retry / back-pressure model, and the API surface style:
///     <list type="bullet">
///         <item><description><see cref="Sync" /> — request / response; caller blocks.</description></item>
///         <item><description><see cref="AsyncBatch" /> — caller submits work and polls or is notified later.</description></item>
///         <item><description><see cref="Event" /> — system emits events the actor subscribes to; decoupled.</description></item>
///         <item><description><see cref="Streaming" /> — continuous data flow in either direction (SSE, WebSocket, gRPC stream).</description></item>
///     </list>
///     When a machine actor is identified, ArchLucid reviews only up to the interaction-contract
///     boundary and treats the external system as a black box with a trust label — preventing
///     unbounded recursion into dependent systems.
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InteractionContract
{
    /// <summary>Synchronous request / response — the caller blocks until a response is returned.</summary>
    Sync,

    /// <summary>
    ///     Asynchronous or batch — the caller submits work and receives the result later
    ///     (polling, webhook callback, message-queue reply).
    /// </summary>
    AsyncBatch,

    /// <summary>
    ///     Event-driven — the actor subscribes to events emitted by the system; no direct
    ///     request / response coupling.
    /// </summary>
    Event,

    /// <summary>
    ///     Streaming — a continuous, bidirectional or unidirectional data flow
    ///     (Server-Sent Events, WebSocket, gRPC server-streaming, etc.).
    /// </summary>
    Streaming,
}
