namespace ArchLucid.Application.Notifications.Email;

/// <summary>Builds absolute asset URLs for HTML email templates (logos must be raster; many clients block SVG in img).</summary>
public static class EmailBrandingUrls
{
    /// <summary>Default logo under the operator static site: PNG app tile.</summary>
    public const string DefaultLogoRelativePath = "/logo/icon-192.png";

    /// <summary>Returns scheme/host/port without userinfo, or <see langword="null"/> when <paramref name="operatorBaseUrl"/> is blank or invalid.</summary>
    public static string? TryNormalizeOperatorBaseAuthority(string? operatorBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(operatorBaseUrl))
            return null;

        string trimmedBase = TrimBeforeLineBreak(operatorBaseUrl.Trim().TrimEnd('/'));

        if (string.IsNullOrWhiteSpace(trimmedBase))
            return null;

        if (!Uri.TryCreate(trimmedBase, UriKind.Absolute, out Uri? absoluteUri) || string.IsNullOrEmpty(absoluteUri.Host))
            return null;

        UriBuilder authorityBuilder = new(absoluteUri.Scheme, absoluteUri.Host, absoluteUri.Port);

        return authorityBuilder.Uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    /// <summary>Rebuilds an absolute URL without embedded userinfo; returns trimmed input when not absolute.</summary>
    public static string SanitizeOperatorAbsoluteUrl(string absoluteUrl)
    {
        ArgumentNullException.ThrowIfNull(absoluteUrl);

        string trimmed = absoluteUrl.Trim();
        int lineBreakIndex = IndexOfLineBreak(trimmed);

        if (lineBreakIndex >= 0)
        {
            string firstLine = trimmed[..lineBreakIndex].TrimEnd();
            int schemeDelimiter = firstLine.IndexOf("://", StringComparison.OrdinalIgnoreCase);
            bool authorityOnlyFirstLine = schemeDelimiter >= 0 && firstLine.IndexOf('/', schemeDelimiter + 3) < 0;

            if (!authorityOnlyFirstLine
                && Uri.TryCreate(firstLine, UriKind.Absolute, out Uri? firstLineUri)
                && !string.IsNullOrEmpty(firstLineUri.Host))
            {
                return RebuildAbsoluteUrlWithoutUserInfo(firstLineUri);
            }

            string? authority = TryNormalizeOperatorBaseAuthority(firstLine);

            if (authority is not null)
            {
                int pathStart = trimmed.IndexOf('/', lineBreakIndex);

                if (pathStart >= 0)
                    return authority + trimmed[pathStart..];
            }
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri) || string.IsNullOrEmpty(uri.Host))
            return trimmed;

        return RebuildAbsoluteUrlWithoutUserInfo(uri);
    }

    private static string RebuildAbsoluteUrlWithoutUserInfo(Uri uri)
    {
        string decodedPath = Uri.UnescapeDataString(uri.AbsolutePath);
        string sanitizedPath = EmailHeaderFragmentSanitizer.Sanitize(decodedPath);
        bool pathHadLineBreaks = PathOrQueryContainsLineBreakMaterial(uri.AbsolutePath, decodedPath);

        UriBuilder builder = new(uri.Scheme, uri.Host, uri.Port)
        {
            Path = pathHadLineBreaks ? sanitizedPath : uri.AbsolutePath,
        };

        if (uri.Query.Length > 0)
        {
            string rawQuery = uri.Query.StartsWith('?') ? uri.Query[1..] : uri.Query;
            builder.Query = SanitizeUriQueryOrFragment(rawQuery);
        }

        if (uri.Fragment.Length > 0)
        {
            string rawFragment = uri.Fragment.StartsWith('#') ? uri.Fragment[1..] : uri.Fragment;
            builder.Fragment = SanitizeUriQueryOrFragment(rawFragment);
        }

        return builder.Uri.ToString();
    }

    private static string SanitizeUriQueryOrFragment(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        if (!PathOrQueryContainsLineBreakMaterial(value, Uri.UnescapeDataString(value)))
            return value;

        return EmailHeaderFragmentSanitizer.Sanitize(Uri.UnescapeDataString(value));
    }

    private static bool PathOrQueryContainsLineBreakMaterial(string encoded, string decoded)
    {
        if (encoded.Contains("%0D", StringComparison.OrdinalIgnoreCase)
            || encoded.Contains("%0A", StringComparison.OrdinalIgnoreCase)
            || encoded.Contains("%E2%80%A8", StringComparison.OrdinalIgnoreCase)
            || encoded.Contains("%E2%80%A9", StringComparison.OrdinalIgnoreCase)
            || encoded.Contains("%C2%85", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        foreach (char character in decoded)
        {

            if (character is '\r' or '\n' or '\u0085' or '\u2028' or '\u2029')
                return true;
        }

        return false;
    }

    /// <summary>
    /// Strips userinfo from absolute URLs and repairs single-slash scheme-only concat paths
    /// (for example <c>https:/architecture/reviews/…</c> from <c>https://</c> operator bases).
    /// </summary>
    public static string SanitizeOperatorNavigableUrl(string url, string? operatorBaseUrl = null)
    {
        ArgumentNullException.ThrowIfNull(url);

        string sanitized = SanitizeOperatorAbsoluteUrl(url.Trim());

        if (Uri.TryCreate(sanitized, UriKind.Absolute, out Uri? absoluteUri) && !string.IsNullOrEmpty(absoluteUri.Host))
            return sanitized;

        string? relativePath = TryExtractMalformedSchemeOnlyConcatPath(sanitized);

        if (relativePath is null)
            return sanitized;

        string? authority = TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (authority is not null)
            return $"{authority}{relativePath}";

        return relativePath;
    }

    private static int IndexOfLineBreak(string value)
    {
        int earliest = -1;

        for (int index = 0; index < value.Length; index++)
        {
            char character = value[index];

            if (character is not ('\r' or '\n' or '\u0085' or '\u2028' or '\u2029'))
                continue;

            if (earliest < 0 || index < earliest)
                earliest = index;
        }

        return earliest;
    }

    private static string TrimBeforeLineBreak(string value)
    {
        int lineBreakIndex = IndexOfLineBreak(value);

        if (lineBreakIndex < 0)
            return value;

        return value[..lineBreakIndex];
    }

    private static string? TryExtractMalformedSchemeOnlyConcatPath(string sanitized)
    {
        if (sanitized.Length > "https:/".Length
            && sanitized.StartsWith("https:/", StringComparison.OrdinalIgnoreCase)
            && !sanitized.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return sanitized["https:".Length..];
        }

        if (sanitized.Length > "http:/".Length
            && sanitized.StartsWith("http:/", StringComparison.OrdinalIgnoreCase)
            && !sanitized.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            return sanitized["http:".Length..];
        }

        return null;
    }

    /// <summary>Returns <see langword="null"/> when <paramref name = "operatorBaseUrl"/> is blank.</summary>
    public static String? TryBuildLogoImageUrl(string? operatorBaseUrl, string relativePath = DefaultLogoRelativePath)
    {
        ArgumentNullException.ThrowIfNull(relativePath);
        if (string.IsNullOrWhiteSpace(relativePath))
            return null;

        string? sanitizedBase = TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (sanitizedBase is null)
            return null;

        string rel = relativePath.StartsWith('/') ? relativePath : "/" + relativePath;
        return $"{sanitizedBase}{rel}";
    }
}
