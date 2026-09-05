using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Http;

/// <summary>
///     Header extraction for inbound billing webhooks. ASP.NET merges duplicate headers into
///     <see cref="StringValues" />; joining with commas breaks Stripe signatures and Bearer tokens.
/// </summary>
public static class InboundWebhookHeaderReader
{
    public static string ExtractFirstNonEmptyHeader(StringValues values)
    {
        foreach (string? value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            return value.Trim();
        }

        return string.Empty;
    }

    public static string? ExtractBearerToken(StringValues authorization)
    {
        foreach (string? value in authorization)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            string trimmed = value.Trim();

            if (!trimmed.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                continue;

            string token = trimmed["Bearer ".Length..].Trim();

            if (token.Length > 0)
                return token;
        }

        return null;
    }
}
