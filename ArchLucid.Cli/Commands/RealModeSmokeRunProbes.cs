using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Run lifecycle probes for <see cref="RealModeSmokeRunner" /> using a shared <see cref="HttpClient" />.
/// </summary>
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

internal sealed class RealModeSmokePollRunProbe(HttpClient http)
{
    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<(RealModeSmokeStepResult Step, string? FinalStatus, long TotalTokens)> ProbeAsync(
        string runId,
        RealModeSmokeCommandOptions options,
        CancellationToken ct)
    {
        const string name = "poll-ready";
        const string hint = "Inspect run status, agent tasks, and worker logs for the runId.";

        DateTimeOffset deadline = DateTimeOffset.UtcNow.AddSeconds(options.TimeoutSeconds);
        string? lastStatus = null;
        long lastTokens = 0;

        while (DateTimeOffset.UtcNow < deadline)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                using HttpResponseMessage response =
                    await _http.GetAsync($"v1/architecture/review/{Uri.EscapeDataString(runId)}", ct);

                if (!response.IsSuccessStatusCode)
                {
                    string body = await response.Content.ReadAsStringAsync(ct);

                    return (
                        new RealModeSmokeStepResult
                        {
                            Name = name,
                            Passed = false,
                            Detail =
                                $"GET /v1/architecture/review/{runId} → {(int)response.StatusCode}: {RealModeSmokeProbeSupport.TrimBody(body)}.",
                            FailureHint = hint,
                        },
                        lastStatus,
                        lastTokens);
                }

                RealModeSmokeRunDetailResponse? detail =
                    await response.Content.ReadFromJsonAsync<RealModeSmokeRunDetailResponse>(JsonCamel, ct);

                lastStatus = detail?.Run?.Status;
                lastTokens = SumTokens(detail?.AgentExecutionLlmCostEstimate?.TokenCounts);

                if (string.Equals(lastStatus, "ReadyForCommit", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(lastStatus, "Committed", StringComparison.OrdinalIgnoreCase))
                {
                    int resultCount = detail?.Results?.Count ?? 0;

                    return (
                        new RealModeSmokeStepResult
                        {
                            Name = name,
                            Passed = true,
                            Detail =
                                $"GET /v1/architecture/review/{runId} → status={lastStatus}, agentResults={resultCount}, tokens={lastTokens}.",
                        },
                        lastStatus,
                        lastTokens);
                }

                if (string.Equals(lastStatus, "Failed", StringComparison.OrdinalIgnoreCase))
                {
                    return (
                        new RealModeSmokeStepResult
                        {
                            Name = name,
                            Passed = false,
                            Detail = $"Run {runId} entered Failed before ReadyForCommit.",
                            FailureHint = hint,
                        },
                        lastStatus,
                        lastTokens);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                return (
                    new RealModeSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = $"Polling failed: {ex.Message}",
                        FailureHint = hint,
                    },
                    lastStatus,
                    lastTokens);
            }

            await Task.Delay(TimeSpan.FromSeconds(options.PollIntervalSeconds), ct);
        }

        return (
            new RealModeSmokeStepResult
            {
                Name = name,
                Passed = false,
                Detail =
                    $"Timed out after {options.TimeoutSeconds}s waiting for ReadyForCommit (lastStatus={lastStatus ?? "<none>"}).",
                FailureHint = hint,
            },
            lastStatus,
            lastTokens);
    }

    private static long SumTokens(RealModeSmokeTokenCounts? tokenCounts)
    {
        if (tokenCounts is null)
            return 0;

        return tokenCounts.Prompt + tokenCounts.Completion;
    }

    private sealed class RealModeSmokeRunDetailResponse
    {
        public RealModeSmokeRunEnvelope? Run { get; set; }

        public List<object>? Results { get; set; }

        public RealModeSmokeLlmCostEstimate? AgentExecutionLlmCostEstimate { get; set; }
    }

    private sealed class RealModeSmokeRunEnvelope
    {
        public string? RunId { get; set; }

        public string? Status { get; set; }
    }

    private sealed class RealModeSmokeLlmCostEstimate
    {
        public RealModeSmokeTokenCounts? TokenCounts { get; set; }
    }

    private sealed class RealModeSmokeTokenCounts
    {
        public long Prompt { get; set; }

        public long Completion { get; set; }
    }
}

internal static class RealModeSmokeProbeSupport
{
    private const string CorrelationHeaderName = "X-Correlation-ID";

    internal static string? ReadCorrelationId(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues(CorrelationHeaderName, out IEnumerable<string>? values))
            return values.FirstOrDefault();

        return null;
    }

    internal static string TrimBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return "<empty>";

        string trimmed = body.Trim();

        return trimmed.Length <= 240 ? trimmed : trimmed[..240] + "…";
    }
}
