using System.Net;
using System.Text;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateExportMatrixProbeResult
{
    public required string ProbeId
    {
        get;
        init;
    }

    public required string Format
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

internal static class ShipGateExportMatrixProbe
{
    internal static string ResolvePath(string pathTemplate, string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(pathTemplate);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return pathTemplate.Replace("{runId}", Uri.EscapeDataString(runId.Trim()), StringComparison.Ordinal);
    }

    internal static async Task<IReadOnlyList<ShipGateExportMatrixProbeResult>> ProbeAsync(
        HttpClient http,
        string runId,
        ShipGateExportMatrixContract contract,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(contract);

        List<ShipGateExportMatrixProbeResult> results = new();

        foreach (ShipGateExportMatrixProbeDefinition probe in contract.Probes)
        {
            ShipGateExportMatrixProbeResult result = await ProbeOneAsync(http, runId, probe, contract, cancellationToken);
            results.Add(result);
        }

        return results;
    }

    private static async Task<ShipGateExportMatrixProbeResult> ProbeOneAsync(
        HttpClient http,
        string runId,
        ShipGateExportMatrixProbeDefinition probe,
        ShipGateExportMatrixContract contract,
        CancellationToken cancellationToken)
    {
        string path = ResolvePath(probe.PathTemplate, runId);

        try
        {
            using HttpResponseMessage response = await SendAsync(http, probe, path, cancellationToken);
            int statusCode = (int)response.StatusCode;

            if (!contract.AcceptableStatusCodes.Contains(statusCode))
            {
                return Fail(probe, $"HTTP {statusCode} not acceptable for {path}");
            }

            byte[] body = await response.Content.ReadAsByteArrayAsync(cancellationToken);

            if (body.Length < probe.MinBodyBytes)
            {
                return Fail(probe, $"HTTP {statusCode}; bodyBytes={body.Length} < min={probe.MinBodyBytes}");
            }

            string? contentType = response.Content.Headers.ContentType?.MediaType;

            if (!ContentTypeMatches(contentType, probe.ExpectedContentTypePrefixes))
            {
                return Fail(probe, $"HTTP {statusCode}; contentType={contentType ?? "(missing)"} not in expected prefixes");
            }

            if (probe.RequireZipMagicBytes && !HasZipMagicBytes(body))
            {
                return Fail(probe, $"HTTP {statusCode}; bodyBytes={body.Length}; missing ZIP magic bytes");
            }

            return new ShipGateExportMatrixProbeResult
            {
                ProbeId = probe.Id,
                Format = probe.Format,
                Success = true,
                Detail = $"HTTP {statusCode}; bodyBytes={body.Length}; contentType={contentType ?? "(missing)"}",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
        {
            return Fail(probe, ex.Message);
        }
    }

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient http,
        ShipGateExportMatrixProbeDefinition probe,
        string path,
        CancellationToken cancellationToken)
    {
        if (string.Equals(probe.Method, "POST", StringComparison.OrdinalIgnoreCase))
        {
            string bodyJson = string.IsNullOrWhiteSpace(probe.RequestBodyJson) ? "{}" : probe.RequestBodyJson;
            using StringContent content = new(bodyJson, Encoding.UTF8, "application/json");

            return await http.PostAsync(path, content, cancellationToken);
        }

        return await http.GetAsync(path, cancellationToken);
    }

    private static bool ContentTypeMatches(string? contentType, IReadOnlyList<string> expectedPrefixes)
    {
        if (expectedPrefixes.Count == 0)
            return true;

        if (string.IsNullOrWhiteSpace(contentType))
            return false;

        return expectedPrefixes.Any(prefix =>
            contentType.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasZipMagicBytes(byte[] body) =>
        body.Length >= 2 && body[0] == 0x50 && body[1] == 0x4B;

    private static ShipGateExportMatrixProbeResult Fail(ShipGateExportMatrixProbeDefinition probe, string detail) =>
        new()
        {
            ProbeId = probe.Id,
            Format = probe.Format,
            Success = false,
            Detail = detail,
        };
}
