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

        if (maxIterations <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxIterations), "The poll must perform at least one status read.");

        TimeSpan delay = delayBetween ?? HarnessPollDefaults.BackgroundJobDefaultDelay;

        if (delay < TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(delayBetween), "The poll delay cannot be negative.");

        BackgroundJobInfo? latest = null;

        for (int i = 0; i < maxIterations; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            HttpResponseMessage statusResponse = await GetJobStatusHttpAsync(client, jobId, cancellationToken);
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

    public static async Task<BackgroundJobInfo> PollJobUntilSucceededAsync(
        HttpClient client,
        string jobId,
        JsonSerializerOptions jsonOptions,
        int maxIterations = HarnessPollDefaults.BackgroundJobDefaultMaxIterations,
        TimeSpan? delayBetween = null,
        CancellationToken cancellationToken = default)
    {
        BackgroundJobInfo terminal = await PollJobUntilTerminalStateAsync(
            client,
            jobId,
            jsonOptions,
            maxIterations,
            delayBetween,
            cancellationToken);

        if (terminal.State != BackgroundJobState.Succeeded)
        {
            throw new InvalidOperationException(
                $"Job '{jobId}' reached {terminal.State} instead of Succeeded. Error: {terminal.Error ?? "(none)"}.");
        }

        return terminal;
    }

    public static async Task<BackgroundJobInfo> PollJobUntilFailedAsync(
        HttpClient client,
        string jobId,
        JsonSerializerOptions jsonOptions,
        int maxIterations = HarnessPollDefaults.BackgroundJobDefaultMaxIterations,
        TimeSpan? delayBetween = null,
        CancellationToken cancellationToken = default)
    {
        BackgroundJobInfo terminal = await PollJobUntilTerminalStateAsync(
            client,
            jobId,
            jsonOptions,
            maxIterations,
            delayBetween,
            cancellationToken);

        if (terminal.State != BackgroundJobState.Failed)
        {
            throw new InvalidOperationException(
                $"Job '{jobId}' reached {terminal.State} instead of Failed. Error: {terminal.Error ?? "(none)"}.");
        }

        return terminal;
    }

    public static Task<HttpResponseMessage> GetJobStatusHttpAsync(
        HttpClient client,
        string jobId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(jobId);

        return client.GetAsync($"/v1/jobs/{jobId}", cancellationToken);
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
