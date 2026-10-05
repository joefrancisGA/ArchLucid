namespace ArchLucid.Api.Services.Admin;

internal static class IdentityProviderUriValidator
{
    internal static bool TryCreateAbsoluteHttpOrHttps(string value, out Uri uri)
    {
        if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(value))
        {
            uri = null!;
            return false;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? parsed)
            || (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps)
            || string.IsNullOrEmpty(parsed.Host)
            || !string.IsNullOrEmpty(parsed.Fragment)
            || !string.IsNullOrEmpty(parsed.UserInfo))
        {
            uri = null!;
            return false;
        }

        uri = parsed;
        return true;
    }
}
