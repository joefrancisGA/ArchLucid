namespace ArchLucid.Api.Tests;

/// <summary>Canonical HTTP helpers for <c>/v1/findings/{findingId}/…</c> and related inspect routes.</summary>
public static class FindingHarnessExtensions
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

    public static Task<HttpResponseMessage> PostFindingMuteHttpAsync(
        this HttpClient client,
        string findingId,
        HttpContent? content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.PostAsync($"/v1/findings/{findingId}/mute", content, cancellationToken);
    }

    public static Task<HttpResponseMessage> PutFindingRemediationAssignmentHttpAsync(
        this HttpClient client,
        string findingId,
        HttpContent? content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.PutAsync($"/v1/findings/{findingId}/remediation-assignment", content, cancellationToken);
    }
}
