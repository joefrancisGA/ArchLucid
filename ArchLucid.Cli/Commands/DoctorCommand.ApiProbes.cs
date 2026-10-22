using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class DoctorCommand
{
    private static readonly JsonSerializerOptions IndentedJson = new() { WriteIndented = true };

    private static async Task PrintApiVersionAsync(ArchLucidApiClient client, CancellationToken ct)
    {
        string? versionJson = await client.GetVersionJsonAsync(ct);

        if (versionJson is null)
        {
            Console.WriteLine();
            Console.WriteLine("API version: (unavailable — GET /version failed or not supported)");

            return;
        }

        Console.WriteLine();
        Console.WriteLine("API version (GET /version):");

        try
        {
            using JsonDocument doc = JsonDocument.Parse(versionJson);
            Console.WriteLine(JsonSerializer.Serialize(doc, IndentedJson));
        }
        catch (JsonException)
        {
            Console.WriteLine(versionJson);
        }
    }

    private static async Task<bool> PrintProbeAsync(
        ArchLucidApiClient client,
        string path,
        string label,
        CancellationToken ct)
    {
        (int code, string body) = await client.GetHealthProbeAsync(path, ct);

        Console.WriteLine();
        Console.WriteLine($"{label} — HTTP {code}");
        Console.WriteLine(TruncateForDisplay(body, 4000));

        return code is >= 200 and < 300;
    }

    private static string TruncateForDisplay(string body, int maxChars)
    {
        if (string.IsNullOrEmpty(body))
            return "(empty body)";

        if (body.Length <= maxChars)
            return body;

        return body[..maxChars] + "\n... (truncated)";
    }
}
