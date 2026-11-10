using System.Text.Json;

using ArchLucid.Api.Models;

namespace ArchLucid.Api.Tests;

/// <summary>Read helpers for runs produced by <see cref="CreateRunForTestAsync" /> / <see cref="RunReadyForExecuteAsync" />.</summary>
public static class CreatedRunForTestHarnessExtensions
{
    public static Task<HttpResponseMessage> GetRunHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{created.RunId}", cancellationToken);
    }

    public static async Task<AgentEvidencePackageResponse> GetEvidenceAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{created.RunId}/evidence", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentEvidencePackageResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AgentExecutionTraceResponse> GetTracesAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{created.RunId}/traces", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentExecutionTraceResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }
}
