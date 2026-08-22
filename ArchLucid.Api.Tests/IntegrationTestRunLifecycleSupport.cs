using System.Net;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL integration runs may complete the authority pipeline during <c>POST /v1/architecture/request</c>.
///     Execute then returns <c>409 Conflict</c> (TB-1007 / EK-07) — helpers treat that as a no-op for test setup.
/// </summary>
public static class IntegrationTestRunLifecycleSupport
{
    public static async Task<bool> IsAuthorityPipelineCompleteExecuteConflictAsync(
        this HttpResponseMessage response,
        CancellationToken cancellationToken = default)
    {
        if (response.StatusCode != HttpStatusCode.Conflict)
            return false;

        string body = await response.Content.ReadAsStringAsync(cancellationToken);

        return body.Contains("authority-pipeline complete", StringComparison.OrdinalIgnoreCase);
    }

    public static async Task PostExecuteUnlessAuthorityPipelineCompleteAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await client.PostAsync(
            $"/v1/architecture/review/{runId}/execute",
            null,
            cancellationToken);

        if (await response.IsAuthorityPipelineCompleteExecuteConflictAsync(cancellationToken))
            return;

        await response.EnsureSuccessForTestAsync();
    }

    public static async Task<HttpResponseMessage> PostExecuteForTestAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        HttpResponseMessage response = await client.PostAsync(
            $"/v1/architecture/review/{runId}/execute",
            null,
            cancellationToken);

        if (await response.IsAuthorityPipelineCompleteExecuteConflictAsync(cancellationToken))
            return response;

        await response.EnsureSuccessForTestAsync();

        return response;
    }
}
