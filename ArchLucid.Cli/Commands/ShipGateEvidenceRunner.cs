using ArchLucid.Cli;

namespace ArchLucid.Cli.Commands;

internal sealed partial class ShipGateEvidenceRunner(
    HttpClient http,
    ArchLucidProjectScaffolder.ArchLucidCliConfig? config = null,
    Func<HttpClient>? alternateScopeClientFactory = null)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ArchLucidProjectScaffolder.ArchLucidCliConfig? _config = config;
    private readonly Func<HttpClient>? _alternateScopeClientFactory = alternateScopeClientFactory;

    public async Task<ShipGateEvidenceReport> RunAsync(
        string runId,
        string? uiBaseUrl = null,
        string? uiBaseUrlSource = null,
        TenantIsolationNegativeTestOptions? tenantIsolationOptions = null,
        bool skipClaimLint = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        RunDetailProbe? runProbe = await TryFetchRunDetailProbeAsync(runId, cancellationToken);

        ShipGateEvidenceGateResult gate1 = await BuildGate1Async(runId, runProbe, cancellationToken);
        ShipGateEvidenceGateResult gate2 = await BuildGate2Async(runId, cancellationToken);
        ShipGateEvidenceGateResult gate3 = await BuildGate3Async(cancellationToken);
        ShipGateEvidenceGateResult gate4 = await BuildGate4Async(runId, skipClaimLint, cancellationToken);
        ShipGateEvidenceGateResult gate5 = await BuildGate5Async(runId, uiBaseUrl, uiBaseUrlSource, cancellationToken);
        ShipGateEvidenceGateResult gate6 = await BuildGate6Async(runId, tenantIsolationOptions, cancellationToken);

        return new ShipGateEvidenceReport
        {
            BaseUrl = (_http.BaseAddress?.ToString() ?? string.Empty).Trim().TrimEnd('/'),
            RunId = runId,
            UiBaseUrl = string.IsNullOrWhiteSpace(uiBaseUrl) ? null : uiBaseUrl.Trim().TrimEnd('/'),
            UiBaseUrlSource = string.IsNullOrWhiteSpace(uiBaseUrlSource) ? null : uiBaseUrlSource,
            GeneratedUtc = DateTime.UtcNow,
            Gates = [gate1, gate2, gate3, gate4, gate5, gate6],
        };
    }
}
