using System.Net;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class FirstReviewCompletionProbe
{
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
}
