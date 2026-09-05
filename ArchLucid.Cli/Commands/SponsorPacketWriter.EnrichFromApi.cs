using System.Net.Http.Headers;

namespace ArchLucid.Cli.Commands;

internal static partial class SponsorPacketWriter
{
    private static async Task EnrichFromApiAsync(
        string runId,
        string apiBaseUrl,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string outputDirectory,
        TextWriter errorWriter,
        CancellationToken cancellationToken)
    {
        string normalized = apiBaseUrl.Trim().TrimEnd('/');
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        using HttpClient http = new();
        http.Timeout = TimeSpan.FromMinutes(3);
        http.BaseAddress = new Uri(normalized + "/");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using HttpResponseMessage SponsorReportResponse =
            await http.GetAsync("v1/roi/sponsor-report", cancellationToken);

        if (SponsorReportResponse.IsSuccessStatusCode)
        {
            string raw = await SponsorReportResponse.Content.ReadAsStringAsync(cancellationToken);
            string pretty = PrettyPrintJson(raw);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.SponsorReportFileName),
                pretty,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: sponsor-report fetch returned {(int)SponsorReportResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.SponsorReportFileName}.");
        }

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        using HttpResponseMessage reviewPacketResponse = await http.GetAsync(
            $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/sponsor-review-packet",
            cancellationToken);

        if (reviewPacketResponse.IsSuccessStatusCode)
        {
            string markdown = await reviewPacketResponse.Content.ReadAsStringAsync(cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.SponsorReviewPacketFileName),
                markdown,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: sponsor-review-packet fetch returned {(int)reviewPacketResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.SponsorReviewPacketFileName}.");
        }

        using HttpResponseMessage firstValueResponse = await http.GetAsync(
            $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report",
            cancellationToken);

        if (firstValueResponse.IsSuccessStatusCode)
        {
            string markdown = await firstValueResponse.Content.ReadAsStringAsync(cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.FirstValueReportFileName),
                markdown,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: first-value-report fetch returned {(int)firstValueResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.FirstValueReportFileName}.");
        }

        _ = config;
    }
}
