namespace ArchLucid.Integrations.AzureDevOps.Tests.Support;

/// <summary>Immutable snapshot of an outbound request seen by <see cref="StubHttpMessageHandler" />.</summary>
/// <remarks>
///     Captured eagerly: the caller disposes its <see cref="HttpRequestMessage" /> (and therefore its content) as soon
///     as the send completes, so assertions that ran against the live request would read disposed state.
/// </remarks>
internal sealed record CapturedHttpRequest(
    HttpMethod Method,
    Uri? RequestUri,
    string? AuthorizationScheme,
    string? AuthorizationParameter,
    string? Body);
