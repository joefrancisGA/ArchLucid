namespace ArchLucid.Cli.Commands;

/// <summary>
///     Executes the <c>archlucid trial smoke</c> happy path against an HTTP API. Pure HTTP — no docker, no SQL,
///     no NSwag client coupling — so it can run against staging in Stripe TEST mode and be unit-tested with a
///     <see cref="HttpMessageHandler" /> mock.
/// </summary>
public sealed partial class TrialSmokeRunner
{
    /// <summary>Canonical correlation header emitted by <c>CorrelationIdMiddleware</c> on every API response.</summary>
    private const string CorrelationHeaderName = "X-Correlation-ID";

    private readonly HttpClient _http;

    public TrialSmokeRunner(HttpClient http)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
    }
}
