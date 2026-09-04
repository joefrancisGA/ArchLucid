using System.Net;

namespace ArchLucid.Cli.Commands;

internal static partial class ReferenceEvidenceCommand
{
    private static async Task<int> DownloadTenantZipAsync(
        HttpClient http,
        Guid tenantId,
        string? outputDirectory,
        bool includeDemo,
        CancellationToken cancellationToken)
    {
        string query = includeDemo ? "?includeDemo=true" : string.Empty;

        using HttpResponseMessage response = await http.GetAsync(
            $"v1/admin/reference-evidence{query}",
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            Console.WriteLine(
                "No committed run found for that tenant (or none after excluding demo runs). Use --include-demo to allow demo seed.");

            return CliExitCode.UsageError;
        }

        if (response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized)
        {
            Console.WriteLine("Admin API key with AdminAuthority is required for --tenant exports.");

            return CliExitCode.OperationFailed;
        }

        if (!response.IsSuccessStatusCode)
        {
            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            Console.WriteLine($"Error {(int)response.StatusCode}: {body}");

            return CliExitCode.OperationFailed;
        }

        byte[] zip = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        string dir = outputDirectory ??
                     Path.Combine(Directory.GetCurrentDirectory(), "reference-evidence", $"tenant-{tenantId:D}");
        Directory.CreateDirectory(dir);
        string zipPath = Path.Combine(dir, $"reference-evidence-{tenantId:D}.zip");
        await File.WriteAllBytesAsync(zipPath, zip, cancellationToken);
        Console.WriteLine($"Wrote {zipPath}");

        return CliExitCode.Success;
    }
}
