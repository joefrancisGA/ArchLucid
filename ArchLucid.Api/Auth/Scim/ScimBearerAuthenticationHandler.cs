using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Auth.Scim;

internal class ScimBearerAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IScimBearerTokenAuthenticator authenticator)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    /// <summary>Max Bearer credentials honored per request (HTTP combination + comma folding).</summary>
    internal const int MaxBearerCredentialsPerRequest = 2;

    private static readonly Regex WhitespaceJoinedBearerCredentialSplit = new(
        @"\s{2,}(?=Bearer\s)",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IScimBearerTokenAuthenticator _authenticator =
        authenticator ?? throw new ArgumentNullException(nameof(authenticator));

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out StringValues header))
            return AuthenticateResult.Fail("Missing Authorization header.");

        AuthorizationBearerParseResult parseResult = TryParseBearerCredentials(header);

        if (parseResult.ErrorMessage is not null)
            return AuthenticateResult.Fail(parseResult.ErrorMessage);

        if (parseResult.BearerTokens.Count == 0)
            return AuthenticateResult.Fail("Authorization must use Bearer scheme.");

        List<ScimBearerAuthenticationResult> successfulAuths = [];
        HashSet<string> distinctTokens = new(StringComparer.Ordinal);

        foreach (string token in parseResult.BearerTokens)
        {

            if (!distinctTokens.Add(token))
            {
                continue;
            }
            ScimBearerAuthenticationResult? auth =
                await _authenticator.TryAuthenticateAsync(token, Context.RequestAborted);

            if (auth is not null)
            {
                successfulAuths.Add(auth);
            }
        }

        if (successfulAuths.Count == 0)
            return AuthenticateResult.Fail("Invalid or revoked SCIM token.");

        if (successfulAuths.Select(static a => a.TenantId).Distinct().Count() > 1)
            return AuthenticateResult.Fail("Authorization presents conflicting tenant credentials.");

        ScimBearerAuthenticationResult selectedAuth = successfulAuths[0];

        Claim[] claims =
        [
            new("tenant_id", selectedAuth.TenantId.ToString("D")),
            new("scim_token_id", selectedAuth.TokenRowId.ToString("D"))
        ];

        ClaimsIdentity identity = new(claims, ScimBearerDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new(identity);

        return AuthenticateResult.Success(new AuthenticationTicket(principal, ScimBearerDefaults.AuthenticationScheme));
    }

    private readonly record struct AuthorizationBearerParseResult(
        IReadOnlyList<string> BearerTokens,
        string? ErrorMessage);

    private static AuthorizationBearerParseResult TryParseBearerCredentials(StringValues authorizationHeader)
    {
        List<string> tokens = [];
        bool sawBearerCredential = false;
        bool sawNonBearerCredential = false;

        foreach (string? headerValue in authorizationHeader)
        {

            if (string.IsNullOrWhiteSpace(headerValue))
            {
                continue;
            }

            // HTTP field combination can fold duplicate Authorization values into one comma-separated header.
            // Some gateways join multiple Bearer lines with LF, semicolons, pipes, vertical tabs, or form feeds instead of a comma.

            foreach (string segment in EnumerateCredentialSegments(headerValue))
            {
                string normalizedSegment = segment.TrimStart('\uFEFF');

                if (TryReadBearerCredentialSegment(normalizedSegment, out string bearerToken))
                {
                    sawBearerCredential = true;

                    if (string.IsNullOrWhiteSpace(bearerToken))
                    {
                        continue;
                    }

                    tokens.Add(bearerToken);

                    continue;
                }

                sawNonBearerCredential = true;
            }
        }

        if (sawBearerCredential && sawNonBearerCredential)
        {
            return new AuthorizationBearerParseResult(
                [],
                "Authorization mixes Bearer credentials with other schemes.");
        }

        if (tokens.Count > MaxBearerCredentialsPerRequest)
        {
            return new AuthorizationBearerParseResult(
                [],
                "Authorization presents too many Bearer credentials.");
        }

        return new AuthorizationBearerParseResult(tokens, null);
    }

    private static IEnumerable<string> EnumerateCredentialSegments(string headerValue)
    {
        foreach (string segment in SplitAuthorizationCredentialSegments(headerValue))
        {
            foreach (string piece in ExpandWhitespaceJoinedBearerSegment(segment))
                yield return piece;
        }
    }

    private static IEnumerable<string> ExpandWhitespaceJoinedBearerSegment(string segment)
    {
        string[] parts = WhitespaceJoinedBearerCredentialSplit.Split(segment);

        if (parts.Length <= 1)
            return [segment];

        List<string> trimmed = [];

        foreach (string part in parts)
        {
            string value = part.Trim();

            if (value.Length > 0)
                trimmed.Add(value);
        }

        return trimmed.Count <= 1 ? [segment] : trimmed;
    }

    private static IEnumerable<string> SplitAuthorizationCredentialSegments(string headerValue) =>
        headerValue.Split([',', ';', '|', '\uFF5C', '\v', '\f', '\0', '\n', '\r'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

    private static bool TryReadBearerCredentialSegment(string segment, out string bearerToken)
    {
        bearerToken = string.Empty;

        if (!segment.StartsWith("Bearer", StringComparison.OrdinalIgnoreCase))
            return false;

        if (segment.Length <= 6)
        {
            bearerToken = string.Empty;
            return true;
        }

        ReadOnlySpan<char> tail = segment.AsSpan(6);

        if (char.IsWhiteSpace(tail[0]))
        {
            bearerToken = tail.Trim().ToString();
            return true;
        }

        if (IsBearerDelimiterOnlyPlaceholder(tail))
        {
            bearerToken = string.Empty;
            return true;
        }

        return false;
    }

    // Glued-after-****** placeholders treated as delimiter-only. Grouped by Unicode block so
    // additions stay reviewable; contiguous spans use explicit ranges.

    // U+007C, U+002F, U+005C: ASCII pipe and slash glyphs.
    private const string BearerGluedDelimiterPlaceholderAscii = "|/\\";

    // U+00D7, U+00F7, U+02C2, U+02C3, U+02CD: multiplication/division signs and modifier-letter
    // arrowheads/macron. U+2010..U+2017, U+203E, U+2044: dash/bar/overline punctuation and
    // fraction slash. U+2215..U+2218: math operator lookalikes.
    private const string BearerGluedDelimiterPlaceholderGeneralPunctuation =
        "\u00D7\u00F7\u02C2\u02C3\u02CD\u2010\u2011\u2012" +
        "\u2013\u2014\u2015\u2016\u2017\u203E\u2044" +
        "\u2215\u2216\u2217\u2218";

    // U+2502..U+2503, U+2506..U+2509, U+2551, U+2571: Box Drawing verticals and diagonal.
    // U+2574..U+257F: Box Drawing block slivers.
    private const string BearerGluedDelimiterPlaceholderBoxDrawing =
        "\u2502\u2503\u2506\u2507\u2508\u2509\u2551\u2571" +
        "\u2574\u2575\u2576\u2577\u2578\u2579\u257A\u257B" +
        "\u257C\u257D\u257E\u257F";

    // U+2580, U+2582..U+259F: Block Elements.
    private const string BearerGluedDelimiterPlaceholderBlockElements =
        "\u2580\u2582\u2583\u2584\u2585\u2586\u2587\u2588" +
        "\u2589\u258A\u258B\u258C\u258D\u258E\u258F\u2590" +
        "\u2591\u2592\u2593\u2594\u2595\u2596\u2597\u2598" +
        "\u2599\u259A\u259B\u259C\u259D\u259E\u259F";

    // U+25A0..U+25A1, U+25AA..U+25AB, U+25B2, U+25BC, U+25C6..U+25C7, U+25CE, U+25CB,
    // U+25CF..U+25D0: Geometric Shapes squares, triangles, diamonds, and circles.
    private const string BearerGluedDelimiterPlaceholderGeometricShapes =
        "\u25A0\u25A1\u25AA\u25AB\u25B2\u25BC\u25C6\u25C7" +
        "\u25CE\u25CB\u25CF\u25D0";

    // U+29F8..U+29F9, U+301C, U+FE31, U+FE57..U+FE58, U+FE63, U+FE68, U+FF0F, U+FF5C, U+FF3C:
    // big solidus operators, wave dash, and small-form/fullwidth presentation variants.
    private const string BearerGluedDelimiterPlaceholderFullwidthForms =
        "\u29F8\u29F9\u301C\uFE31\uFE57\uFE58\uFE63\uFE68" +
        "\uFF0F\uFF5C\uFF3C";

    private static readonly string BearerGluedDelimiterPlaceholderCodePoints =
        BearerGluedDelimiterPlaceholderAscii +
        BearerGluedDelimiterPlaceholderGeneralPunctuation +
        BearerGluedDelimiterPlaceholderBoxDrawing +
        BearerGluedDelimiterPlaceholderBlockElements +
        BearerGluedDelimiterPlaceholderGeometricShapes +
        BearerGluedDelimiterPlaceholderFullwidthForms;

    private static bool IsBearerDelimiterOnlyPlaceholder(ReadOnlySpan<char> tail)
    {
        foreach (char character in tail)
        {
            if (BearerGluedDelimiterPlaceholderCodePoints.Contains(character))
                continue;

            if (char.IsWhiteSpace(character))
                continue;

            return false;
        }

        return true;
    }
}
