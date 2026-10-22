namespace ArchLucid.Cli.Commands;

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
