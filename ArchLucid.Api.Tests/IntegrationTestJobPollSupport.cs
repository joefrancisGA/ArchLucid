using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Poll async job status endpoints in integration tests.</summary>
public static class IntegrationTestJobPollSupport
{
    public static async Task<string> PollJobUntilSucceededOrFailedAsync(
        HttpClient client,
        string jobId,
        JsonSerializerOptions jsonOptions,
        int maxIterations = 25,
        TimeSpan? delayBetween = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(jobId);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        TimeSpan delay = delayBetween ?? TimeSpan.FromMilliseconds(200);
        string state = "Pending";

        for (int i = 0; i < maxIterations; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            HttpResponseMessage statusResp = await client.GetAsync($"/v1/jobs/{jobId}", cancellationToken).ConfigureAwait(false);
            JsonElement status = await statusResp.ReadJsonForTestAsync<JsonElement>(jsonOptions, cancellationToken).ConfigureAwait(false);
            state = status.GetProperty("state").GetString() ?? state;

            if (string.Equals(state, "Succeeded", StringComparison.OrdinalIgnoreCase)
                || string.Equals(state, "Failed", StringComparison.OrdinalIgnoreCase))
                return state;

            await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
        }

        return state;
    }

    public static Task<HttpResponseMessage> GetJobFileHttpAsync(
        HttpClient client,
        string jobId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(jobId);

        return client.GetAsync($"/v1/jobs/{jobId}/file", cancellationToken);
    }
}
