using System.Text.Json;

using ArchLucid.Api.Models;

namespace ArchLucid.Api.Tests;

/// <summary>Read helpers for runs produced by <see cref="ArrangeFinalizedAsync" />.</summary>
public static class FinalizedRunHarnessExtensions
{
    public static async Task<ManifestMarkdownDocumentResponse> GetManifestSummaryAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/manifest/{finalized.ManifestVersion}/summary", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<ManifestMarkdownDocumentResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunDetailsResponseDto> GetRunDetailsAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunDetailsResponseDto>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }
}
