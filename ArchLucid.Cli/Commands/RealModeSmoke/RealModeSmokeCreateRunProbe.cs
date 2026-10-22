using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class RealModeSmokeCreateRunProbe(HttpClient http)
{
    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<(RealModeSmokeStepResult Step, string? RunId, string? CorrelationId)> ProbeAsync(CancellationToken ct)
    {
        const string name = "create-run";
        const string hint = "Look for ArchitectureRunCreated / CreateRunFailed in dbo.AuditEvents.";

        RealModeSmokeCreateRequest payload = new()
        {
            RequestId = Guid.NewGuid().ToString("N"),
            SystemName = "Real-Mode Staging Smoke",
            Description =
                "Automated nightly real-mode staging smoke — minimal Azure web tier brief for agent execution probe.",
            Environment = "staging",
            CloudProvider = "Azure",
            Constraints = ["smoke-test", "real-mode-nightly"],
            RequiredCapabilities = ["web"],
            Assumptions = ["archlucid real-mode smoke --staging"],
        };

        try
        {
            using HttpResponseMessage response = await _http.PostAsJsonAsync("v1/architecture/request", payload, ct);
            string? correlationId = RealModeSmokeProbeSupport.ReadCorrelationId(response);

            if (response.StatusCode is not HttpStatusCode.OK and not HttpStatusCode.Created)
            {
                string body = await response.Content.ReadAsStringAsync(ct);

                return (
                    new RealModeSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = $"POST /v1/architecture/request → {(int)response.StatusCode}: {RealModeSmokeProbeSupport.TrimBody(body)}.",
                        FailureHint = hint,
                    },
                    null,
                    correlationId);
            }

            RealModeSmokeCreateResponse? body200 =
                await response.Content.ReadFromJsonAsync<RealModeSmokeCreateResponse>(JsonCamel, ct);

            string? runId = body200?.Run?.RunId;

            if (string.IsNullOrWhiteSpace(runId))
            {
                return (
                    new RealModeSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = "POST /v1/architecture/request → 2xx but runId missing.",
                        FailureHint = hint,
                    },
                    null,
                    correlationId);
            }

            return (
                new RealModeSmokeStepResult
                {
                    Name = name,
                    Passed = true,
                    Detail = $"POST /v1/architecture/request → {(int)response.StatusCode} (runId={runId}).",
                },
                runId,
                correlationId);
        }
        catch (Exception ex)
        {
            return (
                new RealModeSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"POST /v1/architecture/request failed: {ex.Message}",
                    FailureHint = hint,
                },
                null,
                null);
        }
    }

    private sealed class RealModeSmokeCreateRequest
    {
        public string RequestId { get; set; } = string.Empty;

        public string SystemName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Environment { get; set; } = string.Empty;

        public string CloudProvider { get; set; } = string.Empty;

        public IReadOnlyList<string> Constraints { get; set; } = [];

        public IReadOnlyList<string> RequiredCapabilities { get; set; } = [];

        public IReadOnlyList<string> Assumptions { get; set; } = [];
    }

    private sealed class RealModeSmokeCreateResponse
    {
        public RealModeSmokeRunEnvelope? Run { get; set; }
    }

    private sealed class RealModeSmokeRunEnvelope
    {
        public string? RunId { get; set; }

        public string? Status { get; set; }
    }
}
