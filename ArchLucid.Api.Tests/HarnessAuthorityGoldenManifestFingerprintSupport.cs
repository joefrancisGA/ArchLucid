using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>SHA-256 of the wire <c>goldenManifest</c> JSON subtree from authority review detail payloads.</summary>
public static class HarnessAuthorityGoldenManifestFingerprintSupport
{
    public static async Task<string> GetWireGoldenManifestSha256HexAsync(
        HttpClient client,
        string runId,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAuthorityReviewDetailHttpAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        JsonElement root = await response.ReadJsonForTestAsync<JsonElement>(jsonOptions, cancellationToken).ConfigureAwait(false);

        return ComputeWireGoldenManifestSha256Hex(root);
    }

    public static string ComputeWireGoldenManifestSha256Hex(JsonElement authorityReviewRoot)
    {
        if (!authorityReviewRoot.TryGetProperty("goldenManifest", out JsonElement golden))
            throw new InvalidOperationException("Response missing goldenManifest (committed run expected).");

        byte[] utf8 = Encoding.UTF8.GetBytes(golden.GetRawText());

        return Convert.ToHexString(SHA256.HashData(utf8));
    }
}
