using System.Net;
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

    /// <summary>Asserts RFC 9457 Problem+JSON shape for negative integration tests.</summary>
    public static async Task<JsonDocument> AssertProblemForTestAsync(
        this HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string? expectedTypeUri = null,
        string? expectedErrorCode = null,
        [CallerMemberName] string callerMemberName = "")
    {
        ArgumentNullException.ThrowIfNull(response);

        if (response.StatusCode != expectedStatus)
        {
            string failureBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            throw new HttpRequestException(
                $"{callerMemberName}: expected HTTP {(int)expectedStatus} {expectedStatus} but got {(int)response.StatusCode} {response.StatusCode}. Body: {failureBody}");
        }
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        JsonDocument body = JsonDocument.Parse(await response.Content.ReadAsStringAsync().ConfigureAwait(false));
        body.RootElement.GetProperty("status").GetInt32().Should().Be((int)expectedStatus);

        if (expectedTypeUri is not null)
            body.RootElement.GetProperty("type").GetString().Should().Be(expectedTypeUri);

        if (expectedErrorCode is not null)
            body.RootElement.GetProperty("errorCode").GetString().Should().Be(expectedErrorCode);

        return body;
    }
}
