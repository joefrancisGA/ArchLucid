using System.Runtime.CompilerServices;

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
}
