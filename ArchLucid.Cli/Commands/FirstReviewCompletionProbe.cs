using System.Net;
using System.Text;
using System.Text.Json;

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

internal static class FirstReviewCompletionProbe
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

    private static FirstReviewCompletionProbeResult EvaluateRunDetailSignal(
        FirstReviewCompletionRunDetailSignal signal,
        FirstReviewCompletionRunSnapshot snapshot)
    {
        if (signal.RequiredStatusValues.Count > 0)
        {
            bool matches = signal.RequiredStatusValues.Any(value =>
                string.Equals(snapshot.StatusRaw, value, StringComparison.OrdinalIgnoreCase));

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = matches,
                Detail = matches
                    ? $"status={snapshot.StatusRaw}"
                    : $"status={snapshot.StatusRaw}; expected one of [{string.Join(", ", signal.RequiredStatusValues)}]",
            };
        }

        if (signal.RequireManifestVersion)
        {
            bool hasManifest = !string.IsNullOrWhiteSpace(snapshot.CurrentManifestVersion);

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasManifest,
                Detail = hasManifest
                    ? $"manifestVersion={snapshot.CurrentManifestVersion}"
                    : "manifestVersion missing",
            };
        }

        if (signal.RequireRequestId)
        {
            bool hasRequest = !string.IsNullOrWhiteSpace(snapshot.RequestId);

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasRequest,
                Detail = hasRequest
                    ? $"requestId={snapshot.RequestId}"
                    : "requestId missing",
            };
        }

        if (signal.RequireAnyExecutionSignal)
        {
            bool hasSignals = snapshot.ResultCount > 0 || snapshot.TaskCount > 0 || snapshot.HasCompletedUtc;

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasSignals,
                Detail =
                    $"taskCount={snapshot.TaskCount}; resultCount={snapshot.ResultCount}; completedUtc={(snapshot.HasCompletedUtc ? "present" : "missing")}",
            };
        }

        return new FirstReviewCompletionProbeResult
        {
            SignalId = signal.Id,
            Success = true,
            Detail = "no-op signal",
        };
    }

    private static async Task<FirstReviewCompletionProbeResult> EvaluateLiveProbeAsync(
        HttpClient http,
        string runId,
        FirstReviewCompletionLiveProbe probe,
        FirstReviewCompletionContract contract,
        CancellationToken cancellationToken)
    {
        string path = ResolvePath(probe.PathTemplate, runId);

        try
        {
            using HttpResponseMessage response = await SendAsync(http, probe, path, cancellationToken);
            int statusCode = (int)response.StatusCode;

            if (!contract.AcceptableStatusCodes.Contains(statusCode))
            {
                return Fail(probe.Id, $"HTTP {statusCode} not acceptable for {path}");
            }

            string body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (probe.MinArrayLength > 0)
            {
                int arrayLength = CountTopLevelArrayLength(body);

                if (arrayLength < probe.MinArrayLength)
                {
                    return Fail(probe.Id, $"HTTP {statusCode}; arrayLength={arrayLength} < min={probe.MinArrayLength}");
                }

                return Pass(probe.Id, $"HTTP {statusCode}; arrayLength={arrayLength}");
            }

            if (probe.MinJsonArrayPropertyLength is not null)
            {
                int propertyLength = CountJsonArrayPropertyLength(body, probe.MinJsonArrayPropertyLength.Property);

                if (propertyLength < probe.MinJsonArrayPropertyLength.Min)
                {
                    return Fail(
                        probe.Id,
                        $"HTTP {statusCode}; {probe.MinJsonArrayPropertyLength.Property}.length={propertyLength} < min={probe.MinJsonArrayPropertyLength.Min}");
                }

                return Pass(probe.Id, $"HTTP {statusCode}; {probe.MinJsonArrayPropertyLength.Property}.length={propertyLength}");
            }

            return Pass(probe.Id, $"HTTP {statusCode}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or JsonException)
        {
            return Fail(probe.Id, ex.Message);
        }
    }

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient http,
        FirstReviewCompletionLiveProbe probe,
        string path,
        CancellationToken cancellationToken)
    {
        if (string.Equals(probe.Method, "POST", StringComparison.OrdinalIgnoreCase))
        {
            using StringContent content = new("{}", Encoding.UTF8, "application/json");

            return await http.PostAsync(path, content, cancellationToken);
        }

        return await http.GetAsync(path, cancellationToken);
    }

    private static int CountTopLevelArrayLength(string body)
    {
        using JsonDocument doc = JsonDocument.Parse(body);

        return doc.RootElement.ValueKind == JsonValueKind.Array
            ? doc.RootElement.GetArrayLength()
            : 0;
    }

    private static int CountJsonArrayPropertyLength(string body, string propertyName)
    {
        using JsonDocument doc = JsonDocument.Parse(body);

        if (!doc.RootElement.TryGetProperty(propertyName, out JsonElement property))
            return 0;

        return property.ValueKind == JsonValueKind.Array
            ? property.GetArrayLength()
            : 0;
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
