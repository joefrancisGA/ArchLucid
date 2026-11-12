using System.Text.Json;

using ArchLucid.Application.Jobs;

namespace ArchLucid.Api.Tests;

/// <summary>Poll async job status endpoints in integration tests.</summary>
public static class IntegrationTestJobPollSupport
{
    public static async Task<BackgroundJobState> PollJobUntilTerminalStateAsync(
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
        BackgroundJobState state = BackgroundJobState.Pending;

        for (int i = 0; i < maxIterations; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            HttpResponseMessage statusResponse = await client.GetAsync($"/v1/jobs/{jobId}", cancellationToken);
            BackgroundJobInfo status =
                await statusResponse.ReadJsonForTestAsync<BackgroundJobInfo>(jsonOptions, cancellationToken);
            state = status.State;

            if (state is BackgroundJobState.Succeeded or BackgroundJobState.Failed)
                return state;

            await Task.Delay(delay, cancellationToken);
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
