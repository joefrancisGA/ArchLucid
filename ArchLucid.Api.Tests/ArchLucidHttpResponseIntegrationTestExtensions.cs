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

        await response.EnsureSuccessForTestAsync();
        T? payload = await response.Content.ReadFromJsonAsync<T>(options, cancellationToken);
        payload.Should().NotBeNull();

        return payload!;
    }

    /// <summary>Success check and non-empty response bytes (export / file integration tests).</summary>
    public static async Task<byte[]> ReadBytesForTestAsync(
        this HttpResponseMessage response,
        [CallerMemberName] string callerMemberName = "")
    {
        ArgumentNullException.ThrowIfNull(response);

        await response.EnsureSuccessForTestAsync(callerMemberName);
        byte[] bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(0);

        return bytes;
    }

    /// <summary>Asserts RFC 9457 Problem+JSON shape for negative integration tests.</summary>
    public static async Task<JsonDocument> AssertProblemForTestAsync(
        this HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string? expectedTypeUri = null,
        string? expectedErrorCode = null,
        string? detailContains = null,
        [CallerMemberName] string callerMemberName = "")
    {
        ArgumentNullException.ThrowIfNull(response);

        if (response.StatusCode != expectedStatus)
        {
            string failureBody = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException(
                $"{callerMemberName}: expected HTTP {(int)expectedStatus} {expectedStatus} but got {(int)response.StatusCode} {response.StatusCode}. Body: {failureBody}");
        }
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        JsonDocument body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("status").GetInt32().Should().Be((int)expectedStatus);

        if (expectedTypeUri is not null)
            body.RootElement.GetProperty("type").GetString().Should().Be(expectedTypeUri);

        if (expectedErrorCode is not null)
            body.RootElement.GetProperty("errorCode").GetString().Should().Be(expectedErrorCode);

        if (detailContains is not null)
            body.RootElement.GetProperty("detail").GetString().Should().Contain(detailContains);

        return body;
    }

    /// <summary>Assert a Problem Details response and return a detached JSON root for focused field assertions.</summary>
    public static async Task<JsonElement> AssertProblemElementForTestAsync(
        this HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string? expectedTypeUri = null,
        string? expectedErrorCode = null,
        string? detailContains = null,
        [CallerMemberName] string callerMemberName = "")
    {
        using JsonDocument body = await response.AssertProblemForTestAsync(
            expectedStatus,
            expectedTypeUri,
            expectedErrorCode,
            detailContains,
            callerMemberName);

        return body.RootElement.Clone();
    }

    /// <summary>Deserialize UTF-8 JSON from a stream without hand-rolled <see cref="JsonDocument" /> in tests.</summary>
    public static async Task<JsonElement> ReadJsonElementForTestAsync(
        this Stream utf8Json,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(utf8Json);

        JsonElement element = await JsonSerializer.DeserializeAsync<JsonElement>(
            utf8Json,
            cancellationToken: cancellationToken);

        return element;
    }
}
