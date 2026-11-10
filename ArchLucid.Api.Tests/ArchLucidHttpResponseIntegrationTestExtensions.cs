using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration-test HTTP assertions: failed responses include bodies (often RFC 9457 Problem Details).
///     <see cref="CallerMemberName" /> identifies the calling member when no explicit label is needed.
/// </summary>
public static class ArchLucidHttpResponseIntegrationTestExtensions
{
    public static async Task EnsureSuccessForTestAsync(this HttpResponseMessage response,
        [CallerMemberName] string callerMemberName = "")
    {
        if (response.IsSuccessStatusCode)
            return;

        string body = await response.Content.ReadAsStringAsync();
        throw new HttpRequestException(
            $"{callerMemberName}: HTTP {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
    }

    /// <summary>Success check, JSON deserialize, and non-null assertion (common integration-test sequence).</summary>
    public static async Task<T> ReadJsonForTestAsync<T>(
        this HttpResponseMessage response,
        JsonSerializerOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(options);

        await response.EnsureSuccessForTestAsync().ConfigureAwait(false);
        T? payload = await response.Content.ReadFromJsonAsync<T>(options, cancellationToken).ConfigureAwait(false);
        payload.Should().NotBeNull();

        return payload!;
    }
}
