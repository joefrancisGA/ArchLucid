using System.Net;

namespace ArchLucid.Cli.Commands;

internal static partial class ShipGateRoiCoherenceProbe
{
    internal static async Task<IReadOnlyList<ShipGateRoiCoherenceProbeResult>> EvaluateAsync(
        HttpClient http,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);

        try
        {
            using HttpResponseMessage response = await http.GetAsync(SponsorReportPath, cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                return
                [
                    Fail(
                        "http-status",
                        $"GET {SponsorReportPath} -> HTTP {(int)response.StatusCode}"),
                ];
            }

            string json = await response.Content.ReadAsStringAsync(cancellationToken);

            return EvaluateJson(json);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
        {
            return [Fail("http-fetch", ex.Message)];
        }
    }
}
