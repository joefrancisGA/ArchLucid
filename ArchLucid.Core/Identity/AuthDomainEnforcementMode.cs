namespace ArchLucid.Core.Identity;

/// <summary>How verified domains influence sign-in method selection.</summary>
public enum AuthDomainEnforcementMode
{
    /// <summary>Email code and SSO remain available; domain row is informational until enforcement is enabled.</summary>
    SsoOptional = 0,

    /// <summary>Verified domain with active IdP requires SSO once enforcement is enabled and routing is tested.</summary>
    SsoRequiredForVerifiedDomain = 1,

    /// <summary>SSO required with audited email-code recovery for designated administrators only.</summary>
    SsoRequiredWithRecoveryException = 2
}
