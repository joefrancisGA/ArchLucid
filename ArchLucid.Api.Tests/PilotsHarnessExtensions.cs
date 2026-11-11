using System.Net.Http.Headers;

namespace ArchLucid.Api.Tests;

/// <summary>Canonical GET helpers for <c>/v1/pilots/*</c> demo and marketing snapshots.</summary>
public static class PilotsHarnessExtensions
{
    public static Task<HttpResponseMessage> GetWhyArchLucidSnapshotHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/why-archlucid-snapshot", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetSponsorEvidencePackHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/sponsor-evidence-pack", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetPilotOutcomeSummaryHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/outcome-summary", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetPilotInProductScorecardHttpAsync(
        this HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync("/v1/pilots/scorecard", cancellationToken);
    }

    public static string BuildRecentPilotRunDeltasPath(int? count = null)
    {
        if (count is null)
            return "/v1/pilots/runs/recent-deltas";

        return $"/v1/pilots/runs/recent-deltas?count={count.Value}";
    }

    public static HttpRequestMessage CreateRecentPilotRunDeltasJsonRequest(int? count = null)
    {
        HttpRequestMessage request = new(HttpMethod.Get, BuildRecentPilotRunDeltasPath(count));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return request;
    }

    public static Task<HttpResponseMessage> GetRecentPilotRunDeltasHttpAsync(
        this HttpClient client,
        int? count = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync(BuildRecentPilotRunDeltasPath(count), cancellationToken);
    }
}
