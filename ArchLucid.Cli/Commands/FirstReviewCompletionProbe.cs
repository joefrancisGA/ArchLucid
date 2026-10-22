namespace ArchLucid.Cli.Commands;

internal sealed class FirstReviewCompletionProbeResult
{
    public required string SignalId
    {
        get;
        init;
    }

    public required bool Success
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }
}

internal sealed class FirstReviewCompletionRunSnapshot
{
    public required string StatusRaw
    {
        get;
        init;
    }

    public string? CurrentManifestVersion
    {
        get;
        init;
    }

    public string? RequestId
    {
        get;
        init;
    }

    public bool HasCompletedUtc
    {
        get;
        init;
    }

    public int TaskCount
    {
        get;
        init;
    }

    public int ResultCount
    {
        get;
        init;
    }
}

internal static partial class FirstReviewCompletionProbe
{
    internal static string ResolvePath(string pathTemplate, string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(pathTemplate);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return pathTemplate.Replace("{runId}", Uri.EscapeDataString(runId.Trim()), StringComparison.Ordinal);
    }

    internal static async Task<IReadOnlyList<FirstReviewCompletionProbeResult>> EvaluateAsync(
        HttpClient http,
        string runId,
        FirstReviewCompletionRunSnapshot? snapshot,
        FirstReviewCompletionContract contract,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(contract);

        List<FirstReviewCompletionProbeResult> results = new();

        if (snapshot is null)
        {
            results.Add(new FirstReviewCompletionProbeResult
            {
                SignalId = "run-detail",
                Success = false,
                Detail = "GET /v1/architecture/review/{runId} failed or returned no run.",
            });

            return results;
        }

        foreach (FirstReviewCompletionRunDetailSignal signal in contract.RunDetailSignals)
        {
            results.Add(EvaluateRunDetailSignal(signal, snapshot));
        }

        foreach (FirstReviewCompletionLiveProbe probe in contract.LiveProbes)
        {
            FirstReviewCompletionProbeResult result = await EvaluateLiveProbeAsync(http, runId, probe, contract, cancellationToken);
            results.Add(result);
        }

        return results;
    }

    private static FirstReviewCompletionProbeResult Pass(string signalId, string detail) =>
        new()
        {
            SignalId = signalId,
            Success = true,
            Detail = detail,
        };

    private static FirstReviewCompletionProbeResult Fail(string signalId, string detail) =>
        new()
        {
            SignalId = signalId,
            Success = false,
            Detail = detail,
        };
}
