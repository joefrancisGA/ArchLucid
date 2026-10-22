using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class ReferenceEvidenceCommand
{
    private static readonly JsonSerializerOptions JsonReadOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<int> DownloadRunBundleAsync(
        HttpClient http,
        string runId,
        string? outputDirectory,
        bool includeDemo,
        CancellationToken cancellationToken)
    {
        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using HttpResponseMessage deltasResponse =
            await http.GetAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/pilot-run-deltas", cancellationToken);

        if (deltasResponse.StatusCode == HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Run '{runId}' was not found (or is out of scope).");

            return CliExitCode.UsageError;
        }

        if (!deltasResponse.IsSuccessStatusCode)
        {
            string body = await deltasResponse.Content.ReadAsStringAsync(cancellationToken);
            Console.WriteLine($"Error {(int)deltasResponse.StatusCode}: {body}");

            return CliExitCode.OperationFailed;
        }

        string deltasJson = await deltasResponse.Content.ReadAsStringAsync(cancellationToken);
        PilotRunDeltasCliShape? shape = JsonSerializer.Deserialize<PilotRunDeltasCliShape>(deltasJson, JsonReadOptions);

        if (shape?.IsDemoTenant == true && !includeDemo)
        {
            Console.WriteLine(
                "This run is the Contoso demo seed. Re-run with --include-demo only when you intentionally export demo numbers (never as a customer reference).");

            return CliExitCode.UsageError;
        }

        string dir = outputDirectory ?? Path.Combine(Directory.GetCurrentDirectory(), "reference-evidence", runId);
        Directory.CreateDirectory(dir);

        await File.WriteAllTextAsync(Path.Combine(dir, "pilot-run-deltas.json"), deltasJson, cancellationToken);

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        using HttpResponseMessage mdResponse =
            await http.GetAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report", cancellationToken);

        if (mdResponse.IsSuccessStatusCode)
        {
            string md = await mdResponse.Content.ReadAsStringAsync(cancellationToken);
            await File.WriteAllTextAsync(Path.Combine(dir, "first-value-report.md"), md, cancellationToken);
        }

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));

        using HttpResponseMessage firstPdf =
            await http.PostAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report.pdf", null,
                cancellationToken);

        if (firstPdf.IsSuccessStatusCode)
        {
            byte[] pdf = await firstPdf.Content.ReadAsByteArrayAsync(cancellationToken);
            await File.WriteAllBytesAsync(Path.Combine(dir, "first-value-report.pdf"), pdf, cancellationToken);
        }

        using HttpResponseMessage sponsorPdf =
            await http.PostAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/sponsor-one-pager", null,
                cancellationToken);

        if (sponsorPdf.IsSuccessStatusCode)
        {
            byte[] pdf = await sponsorPdf.Content.ReadAsByteArrayAsync(cancellationToken);
            await File.WriteAllBytesAsync(Path.Combine(dir, "sponsor-one-pager.pdf"), pdf, cancellationToken);
        }

        Console.WriteLine($"Wrote reference evidence under {dir}");

        return CliExitCode.Success;
    }

    private sealed class PilotRunDeltasCliShape
    {
        public bool IsDemoTenant
        {
            get;
            init;
        }
    }
}
