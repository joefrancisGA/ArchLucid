namespace ArchLucid.Api.Tests;

/// <summary>Canonical GET helpers for <c>/v1/findings/*</c> inspect routes.</summary>
public static class FindingInspectHarnessExtensions
{
    public static Task<HttpResponseMessage> GetFindingInspectHttpAsync(
        this HttpClient client,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.GetAsync($"/v1/findings/{findingId}/inspect", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewScopedFindingInspectHttpAsync(
        this HttpClient client,
        Guid runGuid,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.GetAsync(
            $"/v1/architecture/review/{runGuid:D}/findings/{findingId}/inspect",
            cancellationToken);
    }
}
