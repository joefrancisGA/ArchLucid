namespace ArchLucid.Api.Services.Admin;

internal static class IdentityProviderUriValidator
{
    internal static bool TryCreateAbsoluteHttpOrHttps(string value, out Uri uri)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? parsed)
            || (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps))
        {
            uri = null!;
            return false;
        }

        uri = parsed;
        return true;
    }
}
