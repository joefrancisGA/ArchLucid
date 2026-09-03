using System.Net.Http.Headers;

namespace ArchLucid.Cli.Commands;

internal interface IBuyerProofArtifactCollector
{
    Task<BuyerProofArtifactCollectionResult> CollectAsync(
        string runId,
        CliHttpProbeSession session,
        bool includePdf,
        CancellationToken cancellationToken);
}

internal sealed class BuyerProofArtifactCollector : IBuyerProofArtifactCollector
{
    public async Task<BuyerProofArtifactCollectionResult> CollectAsync(
        string runId,
        CliHttpProbeSession session,
        bool includePdf,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(session);

        CliPilotRunDeltasFetchResult deltasFetch = await session.FetchPilotRunDeltasAsync(runId, cancellationToken);

        if (deltasFetch.NotFound)
        {
            return BuyerProofArtifactCollectionResult.NotFound(runId);
        }

        if (!deltasFetch.Success)
        {
            return BuyerProofArtifactCollectionResult.FetchFailed(
                $"Error fetching pilot-run-deltas: {deltasFetch.StatusCode}: {deltasFetch.Body}");
        }

        if (!BuyerProofPackCommitGuard.TryValidate(deltasFetch.Body, out bool demoWarning, out string? gateError))
            return BuyerProofArtifactCollectionResult.GateFailed(gateError ?? "Commit guard failed.");

        HttpClient http = session.Http;

        using HttpResponseMessage mdResponse =
            await http.GetAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report", cancellationToken);

        if (!mdResponse.IsSuccessStatusCode)
        {
            return BuyerProofArtifactCollectionResult.FetchFailed(
                $"Error fetching first-value Markdown: {(int)mdResponse.StatusCode}");
        }

        string markdown = await mdResponse.Content.ReadAsStringAsync(cancellationToken);
        byte[]? pdfBytes = null;

        if (includePdf)
        {
            using HttpRequestMessage pdfReq = new(HttpMethod.Post,
                $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report.pdf");

            pdfReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));

            using HttpResponseMessage pdfResponse = await http.SendAsync(pdfReq, cancellationToken);

            if (!pdfResponse.IsSuccessStatusCode)
            {
                return BuyerProofArtifactCollectionResult.FetchFailed(
                    $"Error fetching first-value PDF: {(int)pdfResponse.StatusCode}");
            }

            pdfBytes = await pdfResponse.Content.ReadAsByteArrayAsync(cancellationToken);
        }

        return BuyerProofArtifactCollectionResult.Success(
            new BuyerProofArtifacts(deltasFetch.Body, demoWarning, markdown, pdfBytes));
    }
}
