using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class SignInMethodRemovalPolicyServiceTests
{
    [Fact]
    public async Task EvaluateAsync_blocks_removal_when_only_one_active_method_remains()
    {
        InMemoryPlatformUserRepository users = new();
        InMemoryAuthenticationIdentityRepository identities = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "Solo", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        AuthenticationIdentityRecord identity = await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.EmailOneTimeCode,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
                Subject = "solo@example.com"
            },
            CancellationToken.None);

        SignInMethodRemovalPolicyService sut = CreateSut(identities, users, clock);

        SignInMethodRemovalEvaluation result =
            await sut.EvaluateAsync(user.Id, identity, CancellationToken.None);

        Assert.False(result.Allowed);
    }

    [Fact]
    public async Task EvaluateAsync_allows_removal_when_another_method_remains()
    {
        InMemoryPlatformUserRepository users = new();
        InMemoryAuthenticationIdentityRepository identities = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "user@example.com",
                NormalizedPrimaryEmail = "user@example.com",
                DisplayName = "User",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        AuthenticationIdentityRecord emailIdentity = await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.EmailOneTimeCode,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
                Subject = "user@example.com"
            },
            CancellationToken.None);

        await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "https://login.microsoftonline.com/tenant/v2.0",
                Subject = "oid-1"
            },
            CancellationToken.None);

        SignInMethodRemovalPolicyService sut = CreateSut(identities, users, clock);

        SignInMethodRemovalEvaluation result =
            await sut.EvaluateAsync(user.Id, emailIdentity, CancellationToken.None);

        Assert.True(result.Allowed);
    }

    private static SignInMethodRemovalPolicyService CreateSut(
        InMemoryAuthenticationIdentityRepository identities,
        InMemoryPlatformUserRepository users,
        FakeTimeProvider clock) =>
        new(
            identities,
            users,
            new AuthSignInRoutingService(
                new InMemoryTenantSignInEmailDomainRepository(),
                new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                new InMemoryTenantIdentityProviderConfigurationRepository(),
                new InMemoryUserInvitationRepository(),
                new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                clock));
}
