using System.Text.Json;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Tests;

/// <summary>Read helpers for the unified pre-finalize readiness contract.</summary>
public static class FinalizeReadinessHarnessExtensions
{
    public static async Task<FinalizeReadinessResult> GetFinalizeReadinessAsync(
        this HttpClient client,
        string runId,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/governance/pre-finalize/readiness/{runId}", cancellationToken);

        return await response.ReadJsonForTestAsync<FinalizeReadinessResult>(jsonOptions, cancellationToken);
    }
}
