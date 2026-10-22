namespace ArchLucid.Cli.Commands;

/// <summary>
///     Health probe steps for <see cref="RealModeSmokeRunner" /> using a shared <see cref="CliHttpProbeSession" /> client.
/// </summary>
internal sealed class RealModeSmokeHealthProbe(HttpClient http)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public Task<RealModeSmokeStepResult> ProbeLiveAsync(CancellationToken ct) =>
        ProbeAsync("health-live", "/health/live", ct);

    public Task<RealModeSmokeStepResult> ProbeReadyAsync(CancellationToken ct) =>
        ProbeAsync("health-ready", "/health/ready", ct);

    private async Task<RealModeSmokeStepResult> ProbeAsync(string stepName, string path, CancellationToken ct)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync(path, ct);

            if (response.IsSuccessStatusCode)
            {
                return new RealModeSmokeStepResult
                {
                    Name = stepName,
                    Passed = true,
                    Detail = $"GET {path} → {(int)response.StatusCode}.",
                };
            }

            return new RealModeSmokeStepResult
            {
                Name = stepName,
                Passed = false,
                Detail = $"GET {path} → {(int)response.StatusCode}.",
                FailureHint = "Confirm the API host is reachable and auth headers are valid.",
            };
        }
        catch (Exception ex)
        {
            return new RealModeSmokeStepResult
            {
                Name = stepName,
                Passed = false,
                Detail = $"GET {path} failed: {ex.Message}",
                FailureHint = "Network or TLS failure reaching the API host.",
            };
        }
    }
}
