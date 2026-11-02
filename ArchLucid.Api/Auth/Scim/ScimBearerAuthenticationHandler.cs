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

    // Gateways sometimes glue a decorative placeholder segment directly onto the ******
    // (e.g. "Bearer▌") when comma-folding Authorization headers. Each group below lists the
    // delimiter-lookalike codepoints observed in that position, grouped by Unicode block.
    // ASCII delimiter lookalikes: vertical line, solidus, reverse solidus.
    private const string BearerGluedAsciiDelimiterLookalikes = "|/\\";

    // Latin-1 Supplement operator lookalikes: multiplication and division signs.
    private const string BearerGluedLatin1OperatorLookalikes = "\u00D7\u00F7";

    // Spacing Modifier Letters lookalikes: arrowheads and low macron.
    private const string BearerGluedModifierLetterLookalikes = "\u02C2\u02C3\u02CD";

    // General Punctuation lookalikes: dashes, double vertical/low lines, overline, fraction slash.
    private const string BearerGluedGeneralPunctuationLookalikes =
        "\u2010\u2011\u2012\u2013\u2014\u2015\u2016\u2017\u203E\u2044";

    // Mathematical Operators lookalikes: division slash, set minus, asterisk and ring operators.
    private const string BearerGluedMathOperatorLookalikes = "\u2215\u2216\u2217\u2218";

    // Box Drawing block lookalikes: verticals, dashed verticals/horizontals, diagonal, and half-weight horizontals.
    private const string BearerGluedBoxDrawingLookalikes =
        "\u2502\u2503\u2506\u2507\u2508\u2509\u2551\u2571" +
        "\u2574\u2575\u2576\u2577\u2578\u2579\u257A\u257B\u257C\u257D\u257E\u257F";

    // Block Elements lookalikes: upper/lower/left partial blocks and the full block
    // (U+2581 is deliberately excluded: not observed as glued placeholders).
    private const string BearerGluedBlockElementLookalikes =
        "\u2580\u2582\u2583\u2584\u2585\u2586\u2587\u2588\u2589\u258A\u258B\u258C\u258D\u258E\u258F\u2590\u2591";

    // Geometric Shapes and Miscellaneous Symbols lookalikes observed as comma-fold placeholders.
    private const string BearerGluedGeometricShapeLookalikes =
        "\u2590\u2591\u2592\u2593\u2594\u2595\u2596\u2597\u2598\u2599\u259A\u259B\u259C\u259D\u259E\u259F" +
        "\u25A0\u25A1\u25AA\u25AB\u25B2\u25B4\u25BC\u25C6\u25C7\u25CE\u25CB\u25CC\u25CF\u25D0\u25D1\u25D2\u25D3\u25D4\u25D5\u25D6\u25D7\u25D8\u25D9\u25DA\u25DB\u25DC\u25DD\u25DE\u25DF\u25E0\u25E1\u25E2\u25E3";

    // Miscellaneous Mathematical Symbols-B lookalikes: big solidus and big reverse solidus.
    private const string BearerGluedBigSolidusLookalikes = "\u29F8\u29F9";

    // CJK Symbols and Punctuation lookalike: wave dash.
    private const string BearerGluedWaveDashLookalike = "\u301C";

    // Small Form Variants / vertical presentation lookalikes: vertical em dash, small exclamation/em dash/hyphen-minus/reverse solidus.
    private const string BearerGluedSmallFormLookalikes = "\uFE31\uFE57\uFE58\uFE63\uFE68";

    // Halfwidth and Fullwidth Forms lookalikes: fullwidth solidus, vertical line, reverse solidus.
    private const string BearerGluedFullwidthLookalikes = "\uFF0F\uFF5C\uFF3C";

    private const string BearerGluedDelimiterPlaceholderCodePoints =
        BearerGluedAsciiDelimiterLookalikes +
        BearerGluedLatin1OperatorLookalikes +
        BearerGluedModifierLetterLookalikes +
        BearerGluedGeneralPunctuationLookalikes +
        BearerGluedMathOperatorLookalikes +
        BearerGluedBoxDrawingLookalikes +
        BearerGluedBlockElementLookalikes +
        BearerGluedGeometricShapeLookalikes +
        BearerGluedBigSolidusLookalikes +
        BearerGluedWaveDashLookalike +
        BearerGluedSmallFormLookalikes +
        BearerGluedFullwidthLookalikes;

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
