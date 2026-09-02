using System.Net;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Cli.Commands;

internal sealed class RealModeSmokeExecuteRunProbe(HttpClient http)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<(RealModeSmokeStepResult Step, string? CorrelationId)> ProbeAsync(string runId, CancellationToken ct)
    {
        const string name = "execute-run";
        const string hint = "Confirm execute is allowed for the API key principal and staging AgentExecution:Mode=Real.";

        using HttpRequestMessage request = new(HttpMethod.Post, $"v1/architecture/review/{Uri.EscapeDataString(runId)}/execute")
        {
            Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json"),
        };

        request.Headers.TryAddWithoutValidation(PilotTryRealModeHeaders.PilotTryRealMode, "1");

        try
        {
            using HttpResponseMessage response = await _http.SendAsync(request, ct);
            string? correlationId = RealModeSmokeProbeSupport.ReadCorrelationId(response);

            if (response.IsSuccessStatusCode)
            {
                return (
                    new RealModeSmokeStepResult
                    {
                        Name = name,
                        Passed = true,
                        Detail =
                            $"POST /v1/architecture/review/{runId}/execute → {(int)response.StatusCode} (pilot real-mode header set).",
                    },
                    correlationId);
            }

            string body = await response.Content.ReadAsStringAsync(ct);

            return (
                new RealModeSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"POST /v1/architecture/review/{runId}/execute → {(int)response.StatusCode}: {RealModeSmokeProbeSupport.TrimBody(body)}.",
                    FailureHint = hint,
                },
                correlationId);
        }
        catch (Exception ex)
        {
            return (
                new RealModeSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"POST /v1/architecture/review/{runId}/execute failed: {ex.Message}",
                    FailureHint = hint,
                },
                null);
        }
    }
}
