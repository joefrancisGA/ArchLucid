using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class SignInMethodRemovalEvaluation
{
    public bool Allowed
    {
        get;
        init;
    }

    public string? CustomerMessage
    {
        get;
        init;
    }
}

public interface ISignInMethodRemovalPolicyService
{
    Task<SignInMethodRemovalEvaluation> EvaluateAsync(
        Guid userId,
        AuthenticationIdentityRecord identityToRemove,
        CancellationToken cancellationToken);
}

public sealed class SignInMethodRemovalPolicyService(
    IAuthenticationIdentityRepository identities,
    IPlatformUserRepository users,
    IAuthSignInRoutingService routingService) : ISignInMethodRemovalPolicyService
{
    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    public async Task<SignInMethodRemovalEvaluation> EvaluateAsync(
        Guid userId,
        AuthenticationIdentityRecord identityToRemove,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AuthenticationIdentityRecord> userIdentities =
            await _identities.ListByUserIdAsync(userId, cancellationToken).ConfigureAwait(false);

        int activeCount = userIdentities.Count(row => row.IsActive);

        if (activeCount <= 1)
        {
            return Block("At least one sign-in method must remain on your account.");
        }

        if (!IsEnterpriseIdentity(identityToRemove))
        {
            return Allow();
        }

        PlatformUserRecord? user = await _users.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);

        if (user?.NormalizedPrimaryEmail is null)
        {
            return Allow();
        }

        AuthSignInRoutingEvaluation routing = await _routingService.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = user.NormalizedPrimaryEmail },
            cancellationToken).ConfigureAwait(false);

        if (!routing.SsoRequired)
        {
            return Allow();
        }

        bool anotherEnterpriseRemains = userIdentities.Any(
            row => row.IsActive
                && row.Id != identityToRemove.Id
                && IsEnterpriseIdentity(row));

        if (!anotherEnterpriseRemains)
        {
            return Block(
                "Your organization requires enterprise sign-in. Add another organization sign-in method before removing this one.");
        }

        return Allow();
    }

    private static bool IsEnterpriseIdentity(AuthenticationIdentityRecord identity) =>
        identity.ProviderType is AuthenticationProviderType.MicrosoftIdentity
            or AuthenticationProviderType.TenantOidc
            or AuthenticationProviderType.TenantSaml
            or AuthenticationProviderType.GoogleIdentity;

    private static SignInMethodRemovalEvaluation Allow() =>
        new() { Allowed = true };

    private static SignInMethodRemovalEvaluation Block(string message) =>
        new() { Allowed = false, CustomerMessage = message };
}
