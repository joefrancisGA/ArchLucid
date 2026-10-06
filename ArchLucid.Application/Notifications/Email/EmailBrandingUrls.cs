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

        string trimmedBase = operatorBaseUrl.Trim().TrimEnd('/');

        if (string.IsNullOrWhiteSpace(trimmedBase))
            return null;

        if (!Uri.TryCreate(trimmedBase, UriKind.Absolute, out Uri? absoluteUri) || string.IsNullOrEmpty(absoluteUri.Host))
            return null;

        UriBuilder authorityBuilder = new(absoluteUri.Scheme, absoluteUri.Host, absoluteUri.Port);

        return authorityBuilder.Uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
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
