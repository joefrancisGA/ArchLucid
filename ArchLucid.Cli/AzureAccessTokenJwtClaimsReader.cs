using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json.Nodes;

namespace ArchLucid.Cli;

/// <summary>
///     Extracts JWT payload claims (middle segment) without validating the signature. Used only to surface identity
///     metadata; callers must never log or serialize the raw bearer token string.
/// </summary>
internal static class AzureAccessTokenJwtClaimsReader
{
    internal static bool TryReadPayloadAsJsonObject(
        string jwt,
        [NotNullWhen(true)] out JsonObject? claims)
    {
        claims = null;

        if (string.IsNullOrWhiteSpace(jwt))
            return false;

        string[] parts = jwt.Split('.', StringSplitOptions.None);

        if (parts.Length != 3 || string.IsNullOrEmpty(parts[1]))
            return false;

        try
        {
            byte[] utf8Payload = DecodeBase64Url(parts[1]);
            string text = Encoding.UTF8.GetString(utf8Payload);

            if (JsonNode.Parse(text) is not JsonObject obj)
                return false;

            claims = obj;

            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (System.Text.Json.JsonException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    /// <remarks>JWT uses unpadded Base64 URL encoding.</remarks>
    private static byte[] DecodeBase64Url(string segment)
    {
        string padded = segment.Replace("-", "+", StringComparison.Ordinal)
            .Replace("_", "/", StringComparison.Ordinal);
        int mod4 = padded.Length % 4;

        if (mod4 == 2)

            padded += "==";

        else if (mod4 == 3)

            padded += "=";

        else if (mod4 == 1)

            throw new FormatException("Invalid base64url payload segment length.");

        return Convert.FromBase64String(padded);
    }
}
