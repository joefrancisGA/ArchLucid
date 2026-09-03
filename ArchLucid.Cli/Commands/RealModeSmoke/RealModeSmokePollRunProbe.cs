using System.Net.Http.Json;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

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
