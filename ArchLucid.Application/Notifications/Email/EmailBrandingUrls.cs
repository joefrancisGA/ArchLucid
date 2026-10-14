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
            string? authority = TryNormalizeOperatorBaseAuthority(TrimBeforeLineBreak(trimmed));

            if (authority is not null)
            {
                int pathStart = trimmed.IndexOf('/', lineBreakIndex);

                if (pathStart >= 0)
                    return authority + trimmed[pathStart..];
            }
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri) || string.IsNullOrEmpty(uri.Host))
            return trimmed;

        UriBuilder builder = new(uri.Scheme, uri.Host, uri.Port)
        {
            Path = uri.AbsolutePath,
        };

        if (uri.Query.Length > 0)
            builder.Query = uri.Query.StartsWith('?') ? uri.Query[1..] : uri.Query;

        if (uri.Fragment.Length > 0)
            builder.Fragment = uri.Fragment.StartsWith('#') ? uri.Fragment[1..] : uri.Fragment;

        return builder.Uri.ToString();
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
        int carriageReturn = value.IndexOf('\r');
        int lineFeed = value.IndexOf('\n');

        if (carriageReturn < 0)
            return lineFeed;

        if (lineFeed < 0)
            return carriageReturn;

        return Math.Min(carriageReturn, lineFeed);
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
