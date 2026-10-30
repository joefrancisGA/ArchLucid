namespace ArchLucid.Core.Configuration.Summary;

using System.Text;

/// <summary>
///     Detects credential material inside non-sensitive configuration effective values (connection strings,
///     URI userinfo, and key/value pairs) without relying on a fixed delimiter whitelist.
/// </summary>
internal static class ConfigurationEmbeddedCredentialMaterialDetector
{
    private static readonly string[] CredentialKeyNames =
    [
        "SharedAccessKey",
        "ClientSecret",
        "client_secret",
        "AccountKey",
        "AccessKey",
        "AccessToken",
        "ApiKey",
        "Api-Key",
        "X-Api-Key",
        "Password",
        "Pwd",
        "PWD",
        "Secret",
        "Token",
        "Sig",
        "SharedAccessSignature",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_ACCESS_KEY_ID",
    ];

    /// <summary>
    ///     Returns <see langword="true" /> when the value likely contains secrets (fail closed on ambiguous key/value shapes).
    /// </summary>
    public static bool ContainsEmbeddedCredentialMaterial(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        ReadOnlySpan<char> trimmed = value.AsSpan().Trim();

        if (trimmed.Length > 0 && trimmed[0] == '\uFEFF')
            trimmed = trimmed.Slice(1).TrimStart();

        if (trimmed.Length < 4)
            return false;

        if (ConfigurationSensitiveConfigValueScanner.TryScanJsonForEmbeddedCredentials(trimmed))
            return true;

        if (ContainsUrlUserInfoCredentials(trimmed))
            return true;

        if (ContainsBasicAuthorizationHeaderCredentials(trimmed))
            return true;

        if (ContainsBearerAuthorizationHeaderCredentials(trimmed))
            return true;

        if (ContainsDigestAuthorizationHeaderCredentials(trimmed))
            return true;

        if (ContainsNegotiateAuthorizationHeaderCredentials(trimmed))
            return true;

        if (ContainsNtlmAuthorizationHeaderCredentials(trimmed))
            return true;

        if (ContainsSetCookieHeaderCredentials(trimmed))
            return true;

        if (!trimmed.Contains('=') && !trimmed.Contains(':') && !trimmed.Contains('%'))
            return false;

        if (ContainsCredentialKeyValuePair(trimmed))
            return true;

        return ContainsCredentialKeyValuePairAfterPercentDecoding(trimmed);
    }

    private static bool ContainsCredentialKeyValuePairAfterPercentDecoding(ReadOnlySpan<char> trimmed)
    {
        if (!trimmed.Contains('%'))
            return false;

        string current = trimmed.ToString();

        const int maxPercentDecodePasses = 33216;

        for (int pass = 0; pass < maxPercentDecodePasses && current.Contains('%'); pass++)
        {
            string decoded = Uri.UnescapeDataString(current);

            if (string.Equals(decoded, current, StringComparison.Ordinal))
                break;

            current = decoded;
            ReadOnlySpan<char> decodedTrimmed = current.AsSpan().Trim();

            if (decodedTrimmed.Length < 4)
                continue;

            if (ContainsUrlUserInfoCredentials(decodedTrimmed))
                return true;

            if (ContainsCredentialKeyValuePair(decodedTrimmed))
                return true;
        }

        return false;
    }

    private static bool ContainsUrlUserInfoCredentials(ReadOnlySpan<char> trimmed)
    {
        if (ContainsSchemeLessUserInfoCredentials(trimmed))
            return true;

        int searchStart = 0;

        while (searchStart < trimmed.Length)
        {
            ReadOnlySpan<char> remainder = trimmed.Slice(searchStart);
            int schemeSeparator = remainder.IndexOf("://".AsSpan(), StringComparison.Ordinal);

            if (schemeSeparator < 0)
                return false;

            int authorityStart = searchStart + schemeSeparator + 3;
            ReadOnlySpan<char> authority = trimmed.Slice(authorityStart);
            int atOffset = authority.IndexOf('@');

            if (atOffset >= 0)
            {
                ReadOnlySpan<char> userInfo = authority.Slice(0, atOffset);

                if (userInfo.Contains(':'))
                    return true;
            }

            searchStart = searchStart + schemeSeparator + 1;
        }

        return false;
    }

    private static bool ContainsBasicAuthorizationHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        int searchStart = 0;

        while (searchStart < trimmed.Length)
        {
            ReadOnlySpan<char> remainder = trimmed.Slice(searchStart);
            int basicIndex = remainder.IndexOf("Basic".AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (basicIndex < 0)
                return false;

            int absoluteBasicIndex = searchStart + basicIndex;
            ReadOnlySpan<char> afterBasic = trimmed.Slice(absoluteBasicIndex + "Basic".Length);

            if (!afterBasic.IsEmpty && char.IsWhiteSpace(afterBasic[0])
                && TryBasicAuthorizationHeaderToken(afterBasic))
                return true;

            searchStart = absoluteBasicIndex + "Basic".Length;
        }

        return false;
    }

    private static bool TryBasicAuthorizationHeaderToken(ReadOnlySpan<char> afterBasic)
    {
        ReadOnlySpan<char> token = TrimLeadingByteOrderMarks(afterBasic.Trim());

        if (TryBasicAuthorizationPayloadFromToken(token))
            return true;

        string tokenText = token.ToString();

        foreach (string segment in tokenText.Split(',', ';', '\t', '\v', '\f', '\r', '\n', '|', '&', '\\', ':', '=', '_', '-', '~', '^', '!', '#', '$', '*', '%', ' '))
        {
            if (segment.Length == 0)
                continue;

            if (TryBasicAuthorizationPayloadFromToken(segment.AsSpan().Trim()))
                return true;
        }

        return false;
    }

    private static bool TryBasicAuthorizationPayloadFromToken(ReadOnlySpan<char> token)
    {
        token = TrimLeadingByteOrderMarks(token);

        if (TryBasicAuthorizationPayloadFromCollapsedToken(token))
            return true;

        int semicolonIndex = token.IndexOf(';');

        if (semicolonIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, semicolonIndex).Trim()))
            return true;

        int pipeIndex = token.IndexOf('|');

        if (pipeIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, pipeIndex).Trim()))
            return true;

        int slashIndex = token.IndexOf('/');

        if (slashIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, slashIndex).Trim()))
            return true;

        int ampersandIndex = token.IndexOf('&');

        if (ampersandIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, ampersandIndex).Trim()))
            return true;

        int tabIndex = token.IndexOf('\t');

        if (tabIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, tabIndex).Trim()))
            return true;

        int verticalTabIndex = token.IndexOf('\v');

        if (verticalTabIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, verticalTabIndex).Trim()))
            return true;

        int formFeedIndex = token.IndexOf('\f');

        if (formFeedIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, formFeedIndex).Trim()))
            return true;

        int carriageReturnIndex = token.IndexOf('\r');

        if (carriageReturnIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, carriageReturnIndex).Trim()))
            return true;

        int lineFeedIndex = token.IndexOf('\n');

        if (lineFeedIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, lineFeedIndex).Trim()))
            return true;

        int lineSeparatorIndex = token.IndexOf('\u2028');

        if (lineSeparatorIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, lineSeparatorIndex).Trim()))
            return true;

        int paragraphSeparatorIndex = token.IndexOf('\u2029');

        if (paragraphSeparatorIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, paragraphSeparatorIndex).Trim()))
            return true;

        int nextLineIndex = token.IndexOf('\u0085');

        if (nextLineIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, nextLineIndex).Trim()))
            return true;

        int noBreakSpaceIndex = token.IndexOf('\u00a0');

        if (noBreakSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, noBreakSpaceIndex).Trim()))
            return true;

        int narrowNoBreakSpaceIndex = token.IndexOf('\u202f');

        if (narrowNoBreakSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, narrowNoBreakSpaceIndex).Trim()))
            return true;

        int figureSpaceIndex = token.IndexOf('\u2007');

        if (figureSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, figureSpaceIndex).Trim()))
            return true;

        int thinSpaceIndex = token.IndexOf('\u2009');

        if (thinSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, thinSpaceIndex).Trim()))
            return true;

        int hairSpaceIndex = token.IndexOf('\u200a');

        if (hairSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, hairSpaceIndex).Trim()))
            return true;

        int punctuationSpaceIndex = token.IndexOf('\u2008');

        if (punctuationSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, punctuationSpaceIndex).Trim()))
            return true;

        int mediumMathematicalSpaceIndex = token.IndexOf('\u205f');

        if (mediumMathematicalSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, mediumMathematicalSpaceIndex).Trim()))
            return true;

        int ideographicSpaceIndex = token.IndexOf('\u3000');

        if (ideographicSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, ideographicSpaceIndex).Trim()))
            return true;

        int zeroWidthSpaceIndex = token.IndexOf('\u200b');

        if (zeroWidthSpaceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, zeroWidthSpaceIndex).Trim()))
            return true;

        int zeroWidthNonJoinerIndex = token.IndexOf('\u200c');

        if (zeroWidthNonJoinerIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, zeroWidthNonJoinerIndex).Trim()))
            return true;

        int zeroWidthJoinerIndex = token.IndexOf('\u200d');

        if (zeroWidthJoinerIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, zeroWidthJoinerIndex).Trim()))
            return true;

        int byteOrderMarkIndex = token.IndexOf('\uFEFF');

        if (byteOrderMarkIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, byteOrderMarkIndex).Trim()))
            return true;

        int quoteIndex = token.IndexOf('"');

        if (quoteIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, quoteIndex).Trim()))
            return true;

        int closeParenIndex = token.IndexOf(')');

        if (closeParenIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, closeParenIndex).Trim()))
            return true;

        int closeBracketIndex = token.IndexOf(']');

        if (closeBracketIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, closeBracketIndex).Trim()))
            return true;

        int closeBraceIndex = token.IndexOf('}');

        if (closeBraceIndex > 0 && TryBasicAuthorizationPayloadFromCollapsedToken(token.Slice(0, closeBraceIndex).Trim()))
            return true;

        if (TryBasicAuthorizationPayloadFromRealmEqualsParameter(token))
            return true;

        return TryBasicAuthorizationPayloadFromQuotedSegments(token);
    }

    private static bool TryBasicAuthorizationPayloadFromRealmEqualsParameter(ReadOnlySpan<char> token)
    {
        int realmIndex = token.IndexOf("realm=".AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (realmIndex < 0)
            return false;

        ReadOnlySpan<char> realmValue = token.Slice(realmIndex + "realm=".Length).Trim();
        int commaIndex = realmValue.IndexOf(',');

        if (commaIndex > 0)
            realmValue = realmValue.Slice(0, commaIndex).Trim();

        if (TryBasicAuthorizationPayloadFromCollapsedToken(realmValue))
            return true;

        return TryBasicAuthorizationPayloadFromQuotedSegments(realmValue);
    }

    private static ReadOnlySpan<char> TrimLeadingByteOrderMarks(ReadOnlySpan<char> token)
    {
        while (token.Length > 0 && token[0] == '\uFEFF')
            token = token.Slice(1);

        return token;
    }

    private static bool TryBasicAuthorizationPayloadFromQuotedSegments(ReadOnlySpan<char> token)
    {
        for (int index = 0; index < token.Length; index++)
        {
            if (token[index] == '<')
            {
                ReadOnlySpan<char> angleRemainder = token.Slice(index + 1);
                int closingAngle = angleRemainder.IndexOf('>');

                if (closingAngle > 0
                    && TryBasicAuthorizationPayloadFromCollapsedToken(angleRemainder.Slice(0, closingAngle)))
                    return true;

                if (closingAngle >= 0)
                    index += closingAngle + 1;

                continue;
            }

            if (token[index] == '[')
            {
                ReadOnlySpan<char> bracketRemainder = token.Slice(index + 1);
                int closingSquare = bracketRemainder.IndexOf(']');

                if (closingSquare > 0
                    && TryBasicAuthorizationPayloadFromCollapsedToken(bracketRemainder.Slice(0, closingSquare)))
                    return true;

                if (closingSquare >= 0)
                    index += closingSquare + 1;

                continue;
            }

            if (token[index] == '(')
            {
                ReadOnlySpan<char> parenRemainder = token.Slice(index + 1);
                int closingParen = parenRemainder.IndexOf(')');

                if (closingParen > 0
                    && TryBasicAuthorizationPayloadFromCollapsedToken(parenRemainder.Slice(0, closingParen)))
                    return true;

                if (closingParen >= 0)
                    index += closingParen + 1;

                continue;
            }

            if (token[index] == '{')
            {
                ReadOnlySpan<char> braceRemainder = token.Slice(index + 1);
                int closingBrace = braceRemainder.IndexOf('}');

                if (closingBrace > 0
                    && TryBasicAuthorizationPayloadFromCollapsedToken(braceRemainder.Slice(0, closingBrace)))
                    return true;

                if (closingBrace >= 0)
                    index += closingBrace + 1;

                continue;
            }

            char quote = token[index];

            if (quote is not '"' and not '\'' and not '`')
                continue;

            ReadOnlySpan<char> remainder = token.Slice(index + 1);
            int closingQuote = remainder.IndexOf(quote);

            if (closingQuote < 0)
                continue;

            if (closingQuote > 0
                && TryBasicAuthorizationPayloadFromCollapsedToken(remainder.Slice(0, closingQuote)))
                return true;

            index += closingQuote + 1;
        }

        return false;
    }

    private static bool TryBasicAuthorizationPayloadFromCollapsedToken(ReadOnlySpan<char> token)
    {
        string payload = CollapseBasicAuthorizationBase64Characters(token);

        if (payload.Length == 0)
            return false;

        try
        {
            ReadOnlySpan<char> payloadSpan = payload.AsSpan();

            for (int layer = 0; layer < 8; layer++)
            {
                byte[] bytes = Convert.FromBase64String(NormalizeBase64PayloadPadding(payloadSpan));
                string decoded = Encoding.UTF8.GetString(bytes);
                ReadOnlySpan<char> decodedTrimmed = decoded.AsSpan().Trim();

                if (decodedTrimmed.IsEmpty)
                    return false;

                if (ContainsUrlUserInfoCredentials(decodedTrimmed))
                    return true;

                int colonIndex = decodedTrimmed.IndexOf(':');

                if (colonIndex > 0 && colonIndex < decodedTrimmed.Length - 1)
                    return true;

                if (layer == 7 || !LooksLikeBase64Payload(decodedTrimmed))
                    return false;

                payloadSpan = decodedTrimmed;
            }

            return false;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string CollapseBasicAuthorizationBase64Characters(ReadOnlySpan<char> token)
    {
        StringBuilder collapsed = new(token.Length);

        foreach (char character in token)
        {
            if (ShouldIgnoreInBasicBase64Collapse(character))
                continue;

            if (char.IsLetterOrDigit(character) || character is '+' or '/' or '=')
            {
                collapsed.Append(character);
                continue;
            }

            break;
        }

        return collapsed.ToString();
    }

    private static bool ShouldIgnoreInBasicBase64Collapse(char character)
    {
        if (char.IsWhiteSpace(character))
            return true;

        return character is '\u200B' or '\u200C' or '\u200D' or '\uFEFF';
    }

    private static string NormalizeBase64PayloadPadding(ReadOnlySpan<char> payload)
    {
        string normalized = payload.ToString();
        int remainder = normalized.Length % 4;

        if (remainder == 0)
            return normalized;

        return normalized + new string('=', 4 - remainder);
    }

    private static bool LooksLikeBase64Payload(ReadOnlySpan<char> value)
    {
        if (value.IsEmpty || value.Length % 4 != 0)
            return false;

        foreach (char c in value)
        {
            if (char.IsWhiteSpace(c))
                continue;

            if (char.IsLetterOrDigit(c) || c is '+' or '/' or '=')
                continue;

            return false;
        }

        return true;
    }

    private static bool ContainsBearerAuthorizationHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        int bearerIndex = trimmed.IndexOf("Bearer".AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (bearerIndex < 0)
            return false;

        ReadOnlySpan<char> afterBearer = trimmed.Slice(bearerIndex + "Bearer".Length);

        if (afterBearer.IsEmpty || !char.IsWhiteSpace(afterBearer[0]))
            return false;

        ReadOnlySpan<char> token = afterBearer.Trim();

        return CollapsedBearerCredentialLength(token) >= 8;
    }

    private static int CollapsedBearerCredentialLength(ReadOnlySpan<char> token)
    {
        int length = 0;

        foreach (char character in token)
        {
            if (char.IsWhiteSpace(character))
                continue;

            length++;
        }

        return length;
    }

    private static bool ContainsDigestAuthorizationHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        int digestIndex = trimmed.IndexOf("Digest".AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (digestIndex < 0)
            return false;

        ReadOnlySpan<char> afterDigest = trimmed.Slice(digestIndex + "Digest".Length);

        if (afterDigest.IsEmpty || !char.IsWhiteSpace(afterDigest[0]))
            return false;

        ReadOnlySpan<char> digestPart = afterDigest.Trim();

        int responseIndex = digestPart.IndexOf("response=", StringComparison.OrdinalIgnoreCase);

        if (responseIndex >= 0)
        {
            ReadOnlySpan<char> valuePart = digestPart.Slice(responseIndex + "response=".Length).Trim();

            return DigestResponseValueLooksLikeCredentialMaterial(valuePart);
        }

        responseIndex = digestPart.IndexOf("response=\"", StringComparison.OrdinalIgnoreCase);

        if (responseIndex < 0)
            return false;

        ReadOnlySpan<char> quotedValue = digestPart.Slice(responseIndex + "response=\"".Length);
        int closingQuote = quotedValue.IndexOf('"');

        return closingQuote >= 4;
    }

    private static bool DigestResponseValueLooksLikeCredentialMaterial(ReadOnlySpan<char> valuePart)
    {
        if (valuePart.IsEmpty)
            return false;

        if (valuePart[0] == '"')
        {
            int closingQuote = valuePart.Slice(1).IndexOf('"');

            return closingQuote >= 4;
        }

        int commaIndex = valuePart.IndexOf(',');

        ReadOnlySpan<char> token = commaIndex > 0 ? valuePart.Slice(0, commaIndex).Trim() : valuePart;

        return token.Length >= 4;
    }

    private static bool ContainsNegotiateAuthorizationHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        int negotiateIndex = trimmed.IndexOf("Negotiate".AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (negotiateIndex < 0)
            return false;

        ReadOnlySpan<char> afterNegotiate = trimmed.Slice(negotiateIndex + "Negotiate".Length);

        if (afterNegotiate.IsEmpty || !char.IsWhiteSpace(afterNegotiate[0]))
            return false;

        ReadOnlySpan<char> token = afterNegotiate.Trim();

        return CollapsedBearerCredentialLength(token) >= 8;
    }

    private static bool ContainsNtlmAuthorizationHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        int ntlmIndex = trimmed.IndexOf("NTLM".AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (ntlmIndex < 0)
            return false;

        ReadOnlySpan<char> afterNtlm = trimmed.Slice(ntlmIndex + "NTLM".Length);

        if (afterNtlm.IsEmpty || !char.IsWhiteSpace(afterNtlm[0]))
            return false;

        ReadOnlySpan<char> token = afterNtlm.Trim();

        return CollapsedBearerCredentialLength(token) >= 8;
    }

    private static bool ContainsSetCookieHeaderCredentials(ReadOnlySpan<char> trimmed)
    {
        if (ContainsCredentialCookieHeaderValue(trimmed, "Set-Cookie:"))
            return true;

        if (ContainsCredentialCookieHeaderValue(trimmed, "Set-Cookie2:"))
            return true;

        if (ContainsCredentialCookieHeaderValue(trimmed, "Cookie2:"))
            return true;

        return ContainsCredentialCookieHeaderValue(trimmed, "Cookie:");
    }

    private static bool ContainsCredentialCookieHeaderValue(ReadOnlySpan<char> trimmed, ReadOnlySpan<char> headerPrefix)
    {
        int headerIndex = trimmed.IndexOf(headerPrefix, StringComparison.OrdinalIgnoreCase);

        if (headerIndex < 0)
            return false;

        ReadOnlySpan<char> cookiePart = trimmed.Slice(headerIndex + headerPrefix.Length).Trim();

        return CookieHeaderContainsCredentialValue(cookiePart);
    }

    private static bool CookieHeaderContainsCredentialValue(ReadOnlySpan<char> cookiePart)
    {
        while (!cookiePart.IsEmpty)
        {
            cookiePart = cookiePart.Trim();
            int equalsIndex = cookiePart.IndexOf('=');

            if (equalsIndex <= 0)
                break;

            ReadOnlySpan<char> valuePart = cookiePart.Slice(equalsIndex + 1).Trim();
            int valueEnd = IndexOfCookiePairDelimiter(valuePart);
            ReadOnlySpan<char> cookieValue = valueEnd > 0 ? valuePart.Slice(0, valueEnd).Trim() : valuePart;

            if (cookieValue.Length >= 8)
                return true;

            if (valueEnd < 0)
                break;

            cookiePart = valuePart.Slice(valueEnd + 1);
        }

        return false;
    }

    private static int IndexOfCookiePairDelimiter(ReadOnlySpan<char> valuePart)
    {
        int bestIndex = -1;

        foreach (char delimiter in new[] { ';', ',', '\t', '\v' })
        {
            int index = valuePart.IndexOf(delimiter);

            if (index < 0)
                continue;

            if (bestIndex < 0 || index < bestIndex)
                bestIndex = index;
        }

        return bestIndex;
    }

    /// <summary>
    ///     Connection strings copied without a scheme (e.g. <c>user:pass@host:5432/db</c>) still embed credentials in userinfo.
    /// </summary>
    private static bool ContainsSchemeLessUserInfoCredentials(ReadOnlySpan<char> trimmed)
    {
        int atIndex = trimmed.IndexOf('@');

        if (atIndex <= 0)
            return false;

        ReadOnlySpan<char> beforeAt = trimmed.Slice(0, atIndex);

        if (beforeAt.Contains("://".AsSpan(), StringComparison.Ordinal))
            return false;

        int colonIndex = beforeAt.IndexOf(':');

        if (colonIndex < 0)
            return false;

        ReadOnlySpan<char> password = beforeAt.Slice(colonIndex + 1).Trim();

        return !password.IsEmpty;
    }

    private static bool ContainsCredentialKeyValuePair(ReadOnlySpan<char> trimmed)
    {
        for (int index = 0; index < trimmed.Length; index++)
        {

            if (!IsPairBoundaryBeforeIndex(trimmed, index))
                continue;

            if (TryMatchCredentialKeyValuePairAt(trimmed, index))
                return true;
        }

        return false;
    }

    private static bool IsPairBoundaryBeforeIndex(ReadOnlySpan<char> trimmed, int index)
    {
        if (index == 0)
            return true;

        char previous = trimmed[index - 1];

        if (IsPairDelimiter(previous))
            return true;

        if (previous != ':')
            return false;

        if (index >= 3 && trimmed.Slice(index - 3, 3).Equals("://".AsSpan(), StringComparison.Ordinal))
            return false;

        return true;
    }

    private static bool IsPairDelimiter(char character) =>
        character is ';' or ',' or '|' or '&' or '?' or '/' or ' ' or '\\' or '\r' or '\n' or '\t' or '\f' or '\v' or '_'
        or '\u00A0' or '\u00AD' or '\u1680' or '\u180E' or '\u2000' or '\u2001' or '\u2002' or '\u2003' or '\u2004'
        or '\u2005' or '\u2006' or '\u2007' or '\u2008' or '\u2009' or '\u200A' or '\u200B' or '\u200C' or '\u200D'
        or '\u200E' or '\u200F' or '\u2011' or '\u2012' or '\u2013' or '\u2014' or '\u2015' or '\u202A' or '\u202B'
        or '\u202C' or '\u202D' or '\u202E' or '\u202F' or '\u205F' or '\u2060' or '\u2066' or '\u2067' or '\u2068'
        or '\u2069' or '\u206A' or '\u206B' or '\u206C' or '\u206D' or '\u206E' or '\u206F' or '\u3000' or '\uFE63' or '\uFF0D' or '\uFF0F'
        or '\u2044' or '\u2571' or '\u2572' or '\u29F8' or '\u29F9' or '\uFE00' or '\uFE01' or '\uFE02' or '\uFE03' or '\uFE04' or '\uFE05' or '\uFE06' or '\uFE07' or '\uFE08' or '\uFE09' or '\uFE0A' or '\uFE0B' or '\uFE0C' or '\uFE0D' or '\uFE0E' or '\uFE0F' or '\uFE31' or '\uFE32' or '\uFE68' or '\uFE69' or '\uFE6A' or '\uFE6B' or '\uFE6C' or '\uFE6D' or '\uFE6E' or '\uFE6F' or '\uFE70' or '\uFE71' or '\uFE72' or '\uFE73' or '\uFE74' or '\uFE75' or '\uFE76' or '\uFE77' or '\uFE78' or '\uFE79' or '\uFE7A' or '\uFE7B' or '\uFE7C' or '\uFE7D' or '\uFE7E' or '\uFE7F' or '\uFE80' or '\uFE81' or '\uFE82' or '\uFE83' or '\uFE84' or '\uFE85' or '\uFE86' or '\uFE87' or '\uFE88' or '\uFE89' or '\uFE8A' or '\uFE8B' or '\uFE8C' or '\uFE8D' or '\uFE8E' or '\uFE8F' or '\uFE90' or '\uFE91' or '\uFE92' or '\uFE93' or '\uFE94' or '\uFE95' or '\uFE96' or '\uFE97' or '\uFE98' or '\uFE99' or '\uFE9A' or '\uFE9B' or '\uFE9C' or '\uFE9D' or '\uFE9E' or '\uFE9F' or '\uFEA0' or '\uFEA1' or '\uFEA2' or '\uFEA3' or '\uFEA4' or '\uFEA5' or '\uFEA6' or '\uFEA7' or '\uFEA8' or '\uFEA9' or '\uFEAA' or '\uFEAB' or '\uFEAC' or '\uFEAD' or '\uFEAE' or '\uFEAF' or '\uFEB0' or '\uFEB1' or '\uFEB2' or '\uFEB3' or '\uFEB4' or '\uFEB5' or '\uFEB6' or '\uFEB7' or '\uFEB8' or '\uFEB9' or '\uFEBA' or '\uFEBB' or '\uFEBC' or '\uFEBD' or '\uFEBE' or '\uFEBF' or '\uFEC0' or '\uFEC1' or '\uFEC2' or '\uFEC3' or '\uFEC4' or '\uFEC5' or '\uFEC6' or '\uFEC7' or '\uFEC8' or '\uFEC9' or '\uFECA' or '\uFECB' or '\uFECC' or '\uFECD' or '\uFECE' or '\uFECF' or '\uFED0' or '\uFED1' or '\uFED2' or '\uFED3' or '\uFED4' or '\uFED5' or '\uFED6' or '\uFED7' or '\uFED8' or '\uFED9' or '\uFEDA' or '\uFEDB' or '\uFEDC' or '\uFEDD' or '\uFEDE' or '\uFEDF' or '\uFEE0' or '\uFEE1' or '\uFEE2' or '\uFEE3' or '\uFEE4' or '\uFEE5' or '\uFEE6' or '\uFEE7' or '\uFEE8' or '\uFEE9' or '\uFEEA' or '\uFEEB' or '\uFEEC' or '\uFEED' or '\uFEEE' or '\uFEEF' or '\uFEF0' or '\uFEF1' or '\uFEF2' or '\uFEF3' or '\uFEF4' or '\uFEF5' or '\uFEF6' or '\uFEF7' or '\uFEF8' or '\uFEF9' or '\uFEFA' or '\uFEFB' or '\uFEFC' or '\uFEFD' or '\uFEFE' or '\uFEFF' or '\uFF3C' or '\uFFE5' or '\uFFE6' or '\uFFE7' or '\uFFE8' or '\uFFE9' or '\uFFEA' or '\uFFEB' or '\uFFEC' or '\uFFED' or '\uFF65' or '\uFF66' or '\uFF67' or '\uFF68' or '\uFF69' or '\uFF6A' or '\uFF6B' or '\uFF6C' or '\uFF6D' or '\uFF6E' or '\uFF6F' or '\uFF70' or '\uFF71' or '\uFF72' or '\uFF73' or '\uFF74' or '\uFF75' or '\uFF76' or '\uFF77' or '\uFF78' or '\uFF79' or '\uFF7A' or '\uFF7B' or '\uFF7C' or '\uFF7D' or '\uFF7E' or '\uFF7F' or '\uFF80' or '\uFF81' or '\uFF82' or '\uFF83' or '\uFF84' or '\uFF85' or '\uFF86' or '\uFF87' or '\uFF88' or '\uFF89' or '\uFF8A' or '\uFF8B' or '\uFF8C' or '\uFF8D' or '\uFF8E' or '\uFF8F' or '\uFF90' or '\uFF91' or '\uFF92' or '\uFF93' or '\uFF94' or '\uFF95' or '\uFF96' or '\uFF97' or '\uFF98' or '\uFF99' or '\uFF9A' or '\uFF9B' or '\uFF9C' or '\uFF9D' or '\uFF9E' or '\uFF9F' or '\uFFA0' or '\uFFA1' or '\uFFA2' or '\uFFA3' or '\uFFA4' or '\uFFA5' or '\uFFA6' or '\uFFA7' or '\uFFA8' or '\uFFA9' or '\uFFAA' or '\uFFAB' or '\uFFAC' or '\uFFAD' or '\uFFAE' or '\uFFAF' or '\uFFB0' or '\uFFB1' or '\uFFB2' or '\uFFB3' or '\uFFB4' or '\uFFB5' or '\uFFB6' or '\uFFB7' or '\uFFB8' or '\uFFB9' or '\uFFBA' or '\uFFBB' or '\uFFBC' or '\uFFBD' or '\uFFBE' or '\uFFBF' or '\uFFC0' or '\uFFC1' or '\uFFC2' or '\uFFC3' or '\uFFC4' or '\uFFC5' or '\uFFC6' or '\uFFC7' or '\uFFC8' or '\uFFC9' or '\uFFCA' or '\uFFCB' or '\uFFCC' or '\uFFCD' or '\uFFCE' or '\uFFCF' or '\uFFD0' or '\uFFD1' or '\uFFD2' or '\uFFD3' or '\uFFD4' or '\uFFD5' or '\uFFD6' or '\uFFD7' or '\uFFD8' or '\uFFD9' or '\uFFFB' or '\uFFFC' or '\uFFFD' or '\uFFFE' or '\uFFFF' or '\uFFF7' or '\uFFA4' or '\uFFA5' or '\uFFA6' or '\uFFA7' or '\uFFA8' or '\uFFA9' or '\uFFAA' or '\uFFAB' or '\uFFAC' or '\uFFAD' or '\uFFAE' or '\uFFAF' or '\uFFB0' or '\uFFB1' or '\uFFB2' or '\uFFB3' or '\uFFB4' or '\uFFB5' or '\uFFB6' or '\uFFB7' or '\uFFB8' or '\uFFB9' or '\uFFBA' or '\uFFBB' or '\uFFBC' or '\uFFBD' or '\uFFBE' or '\uFFBF' or '\uFFC0' or '\uFFC1' or '\uFFC2' or '\uFFC3' or '\uFFC4' or '\uFFC5' or '\uFFC6' or '\uFFC7' or '\uFFC8' or '\uFFC9' or '\uFFCA' or '\uFFCB' or '\uFFCC' or '\uFFCD' or '\uFFCE' or '\uFFCF' or '\uFFD0' or '\uFFD1' or '\uFFD2' or '\uFFD3' or '\uFFD4' or '\uFFD5' or '\uFFD6' or '\uFFD7' or '\uFFD8' or '\uFFD9' or '\uFFDA' or '\uFFDB' or '\uFFDC' or '\uFFDD' or '\uFFDE' or '\uFFDF' or '\uFFE0' or '\uFFE1' or '\uFFE2' or '\uFFE3' or '\uFFE4' or '\uFFE5' or '\uFFE6' or '\uFFE7' or '\uFFE8' or '\uFFE9' or '\uFFEA' or '\uFFEB' or '\uFFEC' or '\uFFED' or '\uFFEE' or '\uFFEF' or '\uFFF0' or '\uFFF1' or '\uFFF2' or '\uFFF3' or '\uFFF4' or '\uFFF5' or '\uFFF6' or '\uFFF7' or '\uFFF8' or '\uFFF9' or '\uFFFA' or '\u2216' or '\u2212' or '\u2215' or '\u0085' or '\u2028' or '\u2029';

    private static bool TryMatchCredentialKeyValuePairAt(ReadOnlySpan<char> trimmed, int index)
    {
        ReadOnlySpan<char> rest = trimmed.Slice(index);

        foreach (string keyName in CredentialKeyNames)
        {

            if (!rest.StartsWith(keyName.AsSpan(), StringComparison.OrdinalIgnoreCase))
                continue;

            int afterKey = keyName.Length;

            if (afterKey < rest.Length && IsKeyContinuationCharacter(rest[afterKey]))
                continue;

            while (afterKey < rest.Length && char.IsWhiteSpace(rest[afterKey]))
                afterKey++;

            if (afterKey >= rest.Length)
                continue;

            // Uri.EscapeDataString applied repeatedly to '=' or ':' yields a compact
            // sequence such as %25253D. Inspect it once rather than decoding the
            // entire config value thousands of times (quadratic work for deep inputs).
            // As with literal separators, empty credential values fail closed.

            if (rest[afterKey] == '%' && IsRepeatedlyEncodedSeparator(rest.Slice(afterKey)))
                return true;

            if (rest[afterKey] is not ('=' or ':'))
                continue;

            if (!HasNonEmptyCredentialValue(rest, afterKey + 1))
            {
                // Fail closed: credential-shaped key with empty value still redacts.
                return true;
            }

            return true;
        }

        return false;
    }

    private static bool IsRepeatedlyEncodedSeparator(ReadOnlySpan<char> value)
    {
        // One encoding of '=' is %3D, and each additional encoding inserts 25
        // after the leading percent: %253D, %25253D, etc. ':' ends in 3A.

        if (value.Length < 3 || value[0] != '%')
            return false;

        int index = 1;

        while (index + 1 < value.Length && value[index] == '2' && value[index + 1] == '5')
            index += 2;

        return index + 1 < value.Length && value[index] == '3'
            && value[index + 1] is 'D' or 'd' or 'A' or 'a';
    }

    private static bool IsKeyContinuationCharacter(char character) =>
        char.IsLetterOrDigit(character) || character is '_' or '-';

    private static bool HasNonEmptyCredentialValue(ReadOnlySpan<char> rest, int valueStart)
    {
        int index = valueStart;

        while (index < rest.Length && char.IsWhiteSpace(rest[index]))
            index++;

        if (index >= rest.Length)
            return false;

        if (rest[index] is '"' or '\'')
        {
            char quote = rest[index];
            index++;

            while (index < rest.Length && rest[index] != quote)
                index++;

            return index > valueStart + 1;
        }

        while (index < rest.Length && !IsValueTerminator(rest, index))
            index++;

        return index > valueStart;
    }

    private static bool IsValueTerminator(ReadOnlySpan<char> rest, int index)
    {
        if (IsPairDelimiter(rest[index]))
            return true;

        if (rest[index] != ':')
            return false;

        if (index >= 3 && rest.Slice(index - 3, 3).Equals("://".AsSpan(), StringComparison.Ordinal))
            return false;

        return true;
    }
}
