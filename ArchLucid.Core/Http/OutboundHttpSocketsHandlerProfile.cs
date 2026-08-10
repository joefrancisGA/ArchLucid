namespace ArchLucid.Core.Http;

/// <summary>
///     Tuned <see cref="System.Net.Http.SocketsHttpHandler" /> presets for outbound <see cref="HttpClient" /> registrations.
/// </summary>
public enum OutboundHttpSocketsHandlerProfile
{
    /// <summary>Loopback health probes and other low-concurrency internal calls.</summary>
    InternalLoopback,

    /// <summary>Third-party SaaS integrations (ITSM, webhooks, OAuth, Turnstile, DNS, GitHub).</summary>
    ExternalIntegration,

    /// <summary>Cloud control-plane and pricing fan-out (ARM, retail prices, multi-cloud catalogs).</summary>
    CloudControlPlane,

    /// <summary>Azure OpenAI completion and batch transport.</summary>
    LlmCompletion,
}
