namespace ArchLucid.Api.Tests;

/// <summary>Canonical HTTP helpers for <c>/v1/findings/{findingId}/…</c> demo and scope routes.</summary>
public static class FindingScopeHarnessExtensions
{
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
