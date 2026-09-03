using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.SignInRouting;

/// <inheritdoc cref="IAuthSignInRoutingEvaluator" />
public sealed class AuthSignInRoutingEvaluator(
    ITenantSignInEmailDomainRepository signInDomains,
    ITenantIdentityProviderConfigurationRepository identityProviders,
    IAuthSignInBypassResolver bypassResolver) : IAuthSignInRoutingEvaluator
{
    private readonly ITenantSignInEmailDomainRepository _signInDomains =
        signInDomains ?? throw new ArgumentNullException(nameof(signInDomains));

    private readonly ITenantIdentityProviderConfigurationRepository _identityProviders =
        identityProviders ?? throw new ArgumentNullException(nameof(identityProviders));

    private readonly IAuthSignInBypassResolver _bypassResolver =
        bypassResolver ?? throw new ArgumentNullException(nameof(bypassResolver));

    public async Task<AuthSignInRoutingEvaluation> EvaluateAsync(
        AuthSignInRoutingRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.NormalizedEmail);

        string? safeReturnPath = AuthSignInReturnPathGuard.TryNormalize(request.ReturnPath);
        string? domain = ExtractDomain(request.NormalizedEmail);

        if (domain is null)
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath);
        }

        TenantSignInEmailDomainRecord? policy =
            await _signInDomains.FindByNormalizedDomainAsync(domain, cancellationToken).ConfigureAwait(false);

        if (policy is null || policy.VerificationStatus != AuthDomainVerificationStatus.Verified || !policy.IsEnforcementActive)
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath);
        }

        return await EvaluateEnforcedPolicyAsync(request, policy, safeReturnPath, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AuthSignInRoutingEvaluation> EvaluateEnforcementPreviewAsync(
        AuthSignInRoutingRequest request,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.NormalizedEmail);

        string? safeReturnPath = AuthSignInReturnPathGuard.TryNormalize(request.ReturnPath);
        TenantSignInEmailDomainRecord? policy =
            await _signInDomains.TryGetAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false);

        if (policy is null || policy.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath);
        }

        if (policy.EnforcementMode == AuthDomainEnforcementMode.SsoOptional)
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath);
        }

        return await EvaluateEnforcedPolicyAsync(request, policy, safeReturnPath, cancellationToken).ConfigureAwait(false);
    }

    private async Task<AuthSignInRoutingEvaluation> EvaluateEnforcedPolicyAsync(
        AuthSignInRoutingRequest request,
        TenantSignInEmailDomainRecord policy,
        string? safeReturnPath,
        CancellationToken cancellationToken)
    {
        AuthSignInRoutingBypassKind bypassKind =
            await _bypassResolver.ResolveBypassKindAsync(request, policy, cancellationToken).ConfigureAwait(false);

        if (bypassKind != AuthSignInRoutingBypassKind.None)
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath, bypassKind);
        }

        if (await _bypassResolver.HasActivePlatformRecoveryGrantAsync(policy.TenantId, policy.NormalizedDomain, cancellationToken)
                .ConfigureAwait(false))
        {
            return AuthSignInRoutingCustomerMessageBuilder.Allow(safeReturnPath, AuthSignInRoutingBypassKind.PlatformGrant);
        }

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(policy.TenantId, cancellationToken).ConfigureAwait(false);

        if (idp is null || !idp.IsActive)
        {
            return AuthSignInRoutingCustomerMessageBuilder.RequireEnterpriseSso(safeReturnPath);
        }

        return AuthSignInRoutingCustomerMessageBuilder.RequireEnterpriseSso(safeReturnPath);
    }

    private static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.LastIndexOf('@');

        if (at < 0 || at >= normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..];
    }
}
