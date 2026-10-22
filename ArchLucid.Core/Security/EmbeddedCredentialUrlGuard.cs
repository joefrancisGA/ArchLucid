namespace ArchLucid.Core.Security;

/// <summary>
///     Detects HTTPS URLs that embed credentials in the userinfo segment (for example <c>https://user:pass@host/path</c>).
/// </summary>
public static class EmbeddedCredentialUrlGuard
{
    /// <summary>Returns <see langword="true" /> when <paramref name="uri" /> carries a non-empty userinfo segment.</summary>
    public static bool HasEmbeddedCredentials(Uri uri)
    {
        ArgumentNullException.ThrowIfNull(uri);

        return !string.IsNullOrEmpty(uri.UserInfo);
    }
}
