using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

internal static class AuthenticationIdentityLinkingSupport
{
    internal const int LinkProposalLifetimeMinutes = 15;

    internal static ExternalIdentityKey BuildEmailOtpKey(string normalizedEmail) =>
        new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = normalizedEmail
        };

    internal static ExternalIdentityKey NormalizeExternalKey(ExternalIdentityKey key) =>
        new()
        {
            ProviderType = key.ProviderType,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(key.NormalizedIssuer),
            Subject = key.Subject.Trim(),
            TenantId = key.TenantId,
            TenantIdentityProviderId = key.TenantIdentityProviderId
        };

    internal static bool RequiresExplicitConfirmation(PlatformUserRecord user, string? normalizedEmail)
    {
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(user.NormalizedPrimaryEmail))
        {
            return false;
        }

        return !string.Equals(user.NormalizedPrimaryEmail, normalizedEmail, StringComparison.Ordinal);
    }

    internal static AuthenticationIdentityLinkProposalView ToProposalView(AuthenticationIdentityLinkProposalRecord proposal)
    {
        string confirmationMessage = proposal.RequiresExplicitConfirmation
            ? "Confirm linking this sign-in method. The verified email differs from your account primary email; your primary email will not change automatically."
            : "Confirm linking this sign-in method to your account.";

        return new AuthenticationIdentityLinkProposalView
        {
            ProposalId = proposal.Id,
            ProviderType = proposal.ProviderType.ToString(),
            ProviderLabel = ResolveProviderLabel(proposal.ProviderType),
            MaskedIdentifier = MaskEmail(proposal.DisplayEmail),
            RequiresExplicitConfirmation = proposal.RequiresExplicitConfirmation,
            ConfirmationMessage = confirmationMessage,
            ExpiresUtc = proposal.ExpiresUtc
        };
    }

    internal static string ResolveProviderLabel(AuthenticationProviderType providerType) =>
        providerType switch
        {
            AuthenticationProviderType.EmailOneTimeCode => "Email code",
            AuthenticationProviderType.MicrosoftIdentity => "Microsoft",
            AuthenticationProviderType.GoogleIdentity => "Google",
            AuthenticationProviderType.TenantOidc => "Organization OIDC",
            AuthenticationProviderType.TenantSaml => "Organization SAML",
            AuthenticationProviderType.TrialLocalPassword => "Local password",
            _ => providerType.ToString()
        };

    internal static string? MaskIdentifier(AuthenticationIdentityRecord identity)
    {
        if (!string.IsNullOrWhiteSpace(identity.DisplayEmail))
        {
            return MaskEmail(identity.DisplayEmail);
        }

        return "Linked identity";
    }

    internal static string? MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        int at = email.IndexOf('@');

        if (at <= 1)
        {
            return email;
        }

        return $"{email[0]}***{email[at..]}";
    }
}
