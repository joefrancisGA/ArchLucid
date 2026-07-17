namespace ArchLucid.Core.Identity;

public enum AuthenticationProviderType
{
    EmailOneTimeCode = 0,
    MicrosoftIdentity = 1,
    GoogleIdentity = 2,
    TrialLocalPassword = 3,
    TenantOidc = 4,
    TenantSaml = 5
}
