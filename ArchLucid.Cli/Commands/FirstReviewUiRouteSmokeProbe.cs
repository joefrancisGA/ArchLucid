using System.Net;

namespace ArchLucid.Cli.Commands;

internal sealed class FirstReviewUiRouteSmokeProbeResult
{
    public required string RouteId
    {
        get;
        init;
    }

    public required string Path
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

internal static class FirstReviewUiRouteSmokeProbe
{
    internal static string ResolvePath(string pathTemplate, string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(pathTemplate);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return pathTemplate.Replace("{runId}", Uri.EscapeDataString(runId.Trim()), StringComparison.Ordinal);
    }

    internal static async Task<IReadOnlyList<FirstReviewUiRouteSmokeProbeResult>> ProbeAsync(
        HttpClient uiHttp,
        string runId,
        FirstReviewUiRouteSmokeContract contract,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(uiHttp);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(contract);

        List<FirstReviewUiRouteSmokeProbeResult> results = new();

        foreach (FirstReviewUiRouteSmokeRoute route in contract.Routes)
        {
            string path = ResolvePath(route.PathTemplate, runId);
            FirstReviewUiRouteSmokeProbeResult result = await ProbeRouteAsync(uiHttp, route.Id, path, contract, cancellationToken);
            results.Add(result);
        }

        return results;
    }

    private static async Task<FirstReviewUiRouteSmokeProbeResult> ProbeRouteAsync(
        HttpClient uiHttp,
        string routeId,
        string path,
        FirstReviewUiRouteSmokeContract contract,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await uiHttp.GetAsync(path, cancellationToken);
            int statusCode = (int)response.StatusCode;
            bool acceptableStatus = contract.AcceptableStatusCodes.Contains(statusCode);

            if (!acceptableStatus)
            {
                return new FirstReviewUiRouteSmokeProbeResult
                {
                    RouteId = routeId,
                    Path = path,
                    Success = false,
                    Detail = $"HTTP {statusCode}",
                };
            }

            if (statusCode is >= 200 and < 300)
            {
                string body = await response.Content.ReadAsStringAsync(cancellationToken);
                string? marker = FindErrorBoundaryMarker(body, contract.ErrorBoundaryMarkers);

                if (marker is not null)
                {
                    return new FirstReviewUiRouteSmokeProbeResult
                    {
                        RouteId = routeId,
                        Path = path,
                        Success = false,
                        Detail = $"HTTP {statusCode}; error-boundary marker={marker}",
                    };
                }
            }

            return new FirstReviewUiRouteSmokeProbeResult
            {
                RouteId = routeId,
                Path = path,
                Success = true,
                Detail = $"HTTP {statusCode}",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return new FirstReviewUiRouteSmokeProbeResult
            {
                RouteId = routeId,
                Path = path,
                Success = false,
                Detail = ex.Message,
            };
        }
    }

    private static string? FindErrorBoundaryMarker(string body, IReadOnlyList<string> markers)
    {
        if (string.IsNullOrWhiteSpace(body) || markers.Count == 0)
            return null;

        string normalized = body.ToLowerInvariant();

        foreach (string marker in markers)
        {
            if (string.IsNullOrWhiteSpace(marker))
                continue;

            if (normalized.Contains(marker, StringComparison.Ordinal))
                return marker;
        }

        return null;
    }

    internal static HttpClient CreateUiClient(string uiBaseUrl)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(uiBaseUrl);

        return new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(2),
            BaseAddress = new Uri(uiBaseUrl.Trim().TrimEnd('/') + "/"),
        };
    }
}
