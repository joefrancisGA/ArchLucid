using System.Text.Json;

using ArchLucid.Application.Jobs;

namespace ArchLucid.Api.Tests;

/// <summary>Poll async job status endpoints in integration tests.</summary>
public static class IntegrationTestJobPollSupport
{
    public static async Task<BackgroundJobInfo> PollJobUntilTerminalStateAsync(
        HttpClient client,
        string jobId,
        JsonSerializerOptions jsonOptions,
        int maxIterations = HarnessPollDefaults.BackgroundJobDefaultMaxIterations,
        TimeSpan? delayBetween = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(jobId);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        TimeSpan delay = delayBetween ?? HarnessPollDefaults.BackgroundJobDefaultDelay;
        BackgroundJobInfo? latest = null;

        for (int i = 0; i < maxIterations; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            HttpResponseMessage statusResponse = await client.GetAsync($"/v1/jobs/{jobId}", cancellationToken);
            latest = await statusResponse.ReadJsonForTestAsync<BackgroundJobInfo>(jsonOptions, cancellationToken);

            if (latest.State is BackgroundJobState.Succeeded or BackgroundJobState.Failed or BackgroundJobState.Canceled)
                return latest;

            await Task.Delay(delay, cancellationToken);
        }

        if (latest is null)
            throw new InvalidOperationException($"Job '{jobId}' poll made no status read (maxIterations={maxIterations}).");

        if (latest.State is not (BackgroundJobState.Succeeded or BackgroundJobState.Failed or BackgroundJobState.Canceled))
        {
            throw new TimeoutException(
                $"Job '{jobId}' did not reach a terminal state within {maxIterations} poll(s). Last state: {latest.State}.");
        }

        return latest;
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
