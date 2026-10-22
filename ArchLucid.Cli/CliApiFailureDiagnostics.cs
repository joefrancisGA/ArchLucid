using System.Text.Json;

namespace ArchLucid.Cli;

/// <summary>Prints correlation id and RFC 9457 support hints after CLI API failures.</summary>
internal static class CliApiFailureDiagnostics
{
    public static void Write(TextWriter? stderr, string? correlationId, string? responseBody)
    {
        stderr ??= Console.Error;

        if (!string.IsNullOrWhiteSpace(correlationId))
            stderr.WriteLine($"Correlation id: {correlationId.Trim()}");

        string? supportHint = TryReadSupportHint(responseBody);

        if (!string.IsNullOrWhiteSpace(supportHint))
            stderr.WriteLine($"Support hint: {supportHint.Trim()}");

        string? errorCode = TryReadErrorCode(responseBody);

        if (!string.IsNullOrWhiteSpace(errorCode))
            stderr.WriteLine($"Error code: {errorCode.Trim()}");
    }

    private static string? TryReadSupportHint(string? responseBody) =>
        TryReadProblemExtension(responseBody, "supportHint");

    private static string? TryReadErrorCode(string? responseBody) =>
        TryReadProblemExtension(responseBody, "errorCode");

    private static string? TryReadProblemExtension(string? responseBody, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(responseBody);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty(propertyName, out JsonElement direct) && direct.ValueKind == JsonValueKind.String)
                return direct.GetString();

            if (root.TryGetProperty("extensions", out JsonElement extensions)
                && extensions.ValueKind == JsonValueKind.Object
                && extensions.TryGetProperty(propertyName, out JsonElement nested)
                && nested.ValueKind == JsonValueKind.String)
            {
                return nested.GetString();
            }
        }
        catch (JsonException)
        {
            // Best-effort parse only.
        }

        return null;
    }
}
