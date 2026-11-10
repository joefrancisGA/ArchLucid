namespace ArchLucid.Api.Tests;

/// <summary><c>/v1/architecture/review/{runId}/…</c> helpers that do not require a harness run record.</summary>
public static class ReviewSubresourceHarnessExtensions
{
    public static Task<HttpResponseMessage> GetReviewFindingsExportCsvHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/findings/export/csv", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewTraceabilityBundleZipHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/traceability-bundle.zip", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewStoredEvidenceFilesHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/evidence/files", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewFindingEvidenceChainHttpAsync(
        this HttpClient client,
        Guid runGuid,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.GetAsync(
            $"/v1/architecture/review/{runGuid:D}/findings/{findingId}/evidence-chain",
            cancellationToken);
    }
}
